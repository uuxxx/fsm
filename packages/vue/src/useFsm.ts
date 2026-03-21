import { shallowRef, readonly, type ShallowRef } from 'vue';
import { makeFsm, type FsmConfig, type FsmLabel, type FsmPlugin, type FsmTransition } from '@uuxxx/fsm';
import type { Rec } from '@uuxxx/utils';

export const useFsm = <TState extends FsmLabel, TTransitions extends Rec<FsmTransition<TState>>, TPlugins extends Array<FsmPlugin<TState, TTransitions>> = []>(
	config: FsmConfig<TState, TTransitions, TPlugins>,
) => {
	const stateRef = shallowRef(config.init);
	const userOnAfterTransition = config.methods?.onAfterTransition;

	const fsm = makeFsm({
		...config,
		methods: {
			...config.methods,
			onAfterTransition(lifecycle) {
				stateRef.value = lifecycle.to;
				userOnAfterTransition?.(lifecycle);
			},
		},
	});

	// eslint-disable-next-line no-unused-vars
	const { state: _state, allStates, ...rest } = fsm;

	return {
		// Cast avoids TS2742: inferred DeepReadonly references internal @vue/shared, breaking .d.ts portability
		state: readonly(stateRef) as Readonly<ShallowRef<TState>>,
		allStates: allStates(),
		...rest,
	};
};
