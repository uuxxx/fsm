import type {Rec} from '@uuxxx/utils';
import type {Label} from '../types/Label';
import type {Plugin} from '../types/Plugin';
import type {Transition} from '../types/Transition';

export const historyPlugin = <TState extends Label, TTransitions extends Rec<Transition<TState>>>() => (api => {
	const history: TState[] = [];
	let pointer = 0;

	api.init(state => history.push(state));

	api.onAfterTransition(({to}) => {
		pointer++;
		history.splice(pointer, history.length - pointer, to);
	});

	return {
		name: 'history' as const,
		api: {
			get(): TState[] {
				return history;
			},
			back(steps: number): TState {
				pointer = Math.max(0, pointer - steps);
				return history[pointer];
			},
			forward(steps: number): TState {
				pointer = Math.min(history.length - 1, pointer + steps);
				return history[pointer];
			},
		},
	};
}) satisfies Plugin<TState, TTransitions>;
