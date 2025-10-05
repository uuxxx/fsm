import type {Noop} from 'lib/utils';
import type {Transition} from './Transition';
import type {Label} from './Label';

type Find<TTransitions extends Array<Transition<Label, Label>>, TName extends Label> = Extract<TTransitions[number], {
	name: TName;
}>['to'];

export type TransitionMethods<TTransitions extends Array<Transition<Label, Label>>> = {
	[K in TTransitions[number]['name']]: Find<TTransitions, K> extends Label ? Noop : Find<TTransitions, K>;
};
