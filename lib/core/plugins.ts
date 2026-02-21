import type {EventEmitter} from './eventEmitter';
import type {Label} from '../types/Label';
import type {ApiForPlugin, Plugin} from '../types/Plugin';
import type {PluginsMethods} from '../types/PluginsMethods';
import type {Transition} from '../types/Transition';
import type {KeyOf, Rec, Ulx} from '../utils';

type Builder<TState extends Label, TTransitions extends Rec<Transition<TState>>, TPlugins extends Array<Plugin<TState, TTransitions>>>
	= {
		register: (plugin: Plugin<TState, TTransitions>) => Builder<TState, TTransitions, TPlugins>;
		make: () => PluginsMethods<TState, TTransitions, TPlugins>;
	};

const makeBuilder = <TState extends Label, TTransitions extends Rec<Transition<TState>>, TPlugins extends Array<Plugin<TState, TTransitions>>>
(eventEmitter: EventEmitter<TState, TTransitions>): Builder<TState, TTransitions, TPlugins> => {
	const methods = {} as PluginsMethods<TState, TTransitions, TPlugins>;

	const api: ApiForPlugin<TState, TTransitions> = {
		init(listener) {
			eventEmitter.listen('init', listener);
		},
		onBeforeTransition(listener) {
			return eventEmitter.listen('onBeforeTransition', listener);
		},
		onAfterTransition(listener) {
			return eventEmitter.listen('onAfterTransition', listener);
		},
	};

	const builder: Builder<TState, TTransitions, TPlugins> = {
		register(plugin) {
			const {name, api: pluginApi} = plugin(api);

			if (name in methods) {
				eventEmitter.emit('error', `There are at least two plugins with the same name: ${name}`);
			}

			methods[name as KeyOf<PluginsMethods<TState, TTransitions, TPlugins>>] = pluginApi;
			return builder;
		},
		make() {
			return methods;
		},
	};

	return builder;
};

export const makePluginsMethods = <TState extends Label, TTransitions extends Rec<Transition<TState>>, TPlugins extends Array<Plugin<TState, TTransitions>>>
(plugins: Ulx<TPlugins>, eventEmitter: EventEmitter<TState, TTransitions>): PluginsMethods<TState, TTransitions, TPlugins> => {
	const builder = makeBuilder<TState, TTransitions, TPlugins>(eventEmitter);
	(plugins ?? []).forEach(builder.register);
	return builder.make();
};

