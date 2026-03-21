import { useRef, useSyncExternalStore } from 'react';
import { makeFsm, type FsmConfig, type FsmLabel, type FsmPlugin, type FsmTransition } from '@uuxxx/fsm';
import type { Rec } from '@uuxxx/utils';

export const useFsm = <TState extends FsmLabel, TTransitions extends Rec<FsmTransition<TState>>, TPlugins extends Array<FsmPlugin<TState, TTransitions>> = []>(
	config: FsmConfig<TState, TTransitions, TPlugins>,
) => {
	const storeRef = useRef<ReturnType<typeof createStore<TState, TTransitions, TPlugins>>>(undefined);
	storeRef.current ??= createStore(config);

	const { subscribe, getState, allStates, rest } = storeRef.current;
	const state = useSyncExternalStore(subscribe, getState);

	return {
		state,
		allStates,
		...rest,
	};
};

function createStore<TState extends FsmLabel, TTransitions extends Rec<FsmTransition<TState>>, TPlugins extends Array<FsmPlugin<TState, TTransitions>> = []>(
	config: FsmConfig<TState, TTransitions, TPlugins>,
) {
	let currentState: TState = config.init;
	const listeners = new Set<() => void>();
	const userOnAfterTransition = config.methods?.onAfterTransition;

	const fsm = makeFsm({
		...config,
		methods: {
			...config.methods,
			onAfterTransition(lifecycle) {
				currentState = lifecycle.to;
				listeners.forEach((l) => l());
				userOnAfterTransition?.(lifecycle);
			},
		},
	});

	// eslint-disable-next-line no-unused-vars
	const { state: _state, allStates, ...rest } = fsm;

	return {
		subscribe: (listener: () => void) => {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		getState: () => currentState,
		allStates: allStates(),
		rest,
	};
}
