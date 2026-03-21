import { useRef, useSyncExternalStore } from 'react';
import { makeFsm, type FsmConfig, type FsmLabel, type FsmPlugin, type FsmTransition } from '@uuxxx/fsm';
import type { Noop, Rec } from '@uuxxx/utils';

export const useFsm = <TState extends FsmLabel, TTransitions extends Rec<FsmTransition<TState>>, TPlugins extends Array<FsmPlugin<TState, TTransitions>>>(
	config: FsmConfig<TState, TTransitions, TPlugins>,
) => {
	const storeRef = useRef<ReturnType<typeof createStore<TState, TTransitions, TPlugins>>>(undefined);
	storeRef.current ??= createStore(config);

	const { subscribe, getState, fsm } = storeRef.current;
	const state = useSyncExternalStore(subscribe, getState);

	return {
		...fsm,
		state,
	};
};

function createStore<TState extends FsmLabel, TTransitions extends Rec<FsmTransition<TState>>, TPlugins extends Array<FsmPlugin<TState, TTransitions>>>(
	config: FsmConfig<TState, TTransitions, TPlugins>,
) {
	let currentState: TState = config.init;
	const listeners = new Set<Noop>();
	const userOnAfterTransition = config.methods?.onAfterTransition;

	const fsm = makeFsm<TState, TTransitions, TPlugins>({
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

	return {
		subscribe: (listener: Noop) => {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		getState: () => currentState,
		fsm,
	};
}
