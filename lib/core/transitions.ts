import type {TransitionMethods} from '../types/TransitionMethods';
import type {Label} from '../types/Label';
import type {Transition} from '../types/Transition';
import {
	guard, type Entries, type KeyOf, type Rec, type Ulx,
} from '../utils';
import type {EventEmitter} from './eventEmitter';
import type {Lifecycle} from '../types/LifecycleMethods';

type Builder<TState extends Label, TTransitions extends Rec<Transition<TState>>> = {
	register: <K extends KeyOf<TTransitions>>(name: K, transition: TTransitions[K]) => Builder<TState, TTransitions>;
	make: () => TransitionMethods<TTransitions>;
};

const makeBuilder = <TState extends Label, TTransitions extends Rec<Transition<TState>>>
(eventEmitter: EventEmitter<TState, TTransitions>, state: () => TState): Builder<TState, TTransitions> => {
	const methods = {} as TransitionMethods<TTransitions>;
	let pending: Ulx<Label>;

	const builder: Builder<TState, TTransitions> = {
		register(name, transition) {
			const checkIsOkAndChangeState = (lifecycle: Lifecycle<TState, Entries<TTransitions>>) => {
				const isOk = eventEmitter.emit('onBeforeTransition', lifecycle)
					.filter(guard.boolean)
					.every(guard.true);

				if (!isOk) {
					return;
				}

				eventEmitter.emit('onAfterTransition', lifecycle);
			};

			methods[name] = (...args: any[]): any => {
				const isErr
					= guard.array(transition.from)
						? !transition.from.includes(state())
						: transition.from !== '*' && transition.from !== state();

				if (isErr) {
					eventEmitter.emit('error', `Transition: ${name as string} is forbidden`);
					return state();
				}

				if (pending) {
					eventEmitter.emit('error', `Transition: ${name as string} can't be made. Has pending transtion: ${pending}`);
					return state();
				}

				if (!guard.function(transition.to)) {
					const lifecycle: Lifecycle<TState, Entries<TTransitions>> = {
						transition: name,
						from: state(),
						to: transition.to,
					};

					checkIsOkAndChangeState(lifecycle);
					return state();
				}

				const value = transition.to(...args);

				if (!guard.promise(value)) {
					const lifecycle: Lifecycle<TState, Entries<TTransitions>> = {
						transition: name,
						from: state(),
						to: value,
						// @ts-expect-error TODO: fix type issue
						args,
					};

					checkIsOkAndChangeState(lifecycle);
					return state();
				}

				pending = name as string;

				return value
					.then(resolvedValue => {
						pending = undefined;

						const lifecycle: Lifecycle<TState, Entries<TTransitions>> = {
							transition: name,
							from: state(),
							to: resolvedValue,
							// @ts-expect-error TODO: fix type issue
							args,
						};

						checkIsOkAndChangeState(lifecycle);
						return state();
					});
			};

			return builder;
		},
		make() {
			return methods;
		},
	};

	return builder;
};

export const makeTransitionMethods = <TState extends Label, TTransitions extends Rec<Transition<TState>>>
(transitions: TTransitions, eventEmitter: EventEmitter<TState, TTransitions>, state: () => TState): TransitionMethods<TTransitions> => {
	const builder = makeBuilder<TState, TTransitions>(eventEmitter, state);
	Object.entries(transitions).forEach(([name, transition]) => builder.register(name, transition as any));
	return builder.make();
};
