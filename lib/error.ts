import type {Label} from './types/Label';
import type {Transition} from './types/Transition';
import {guard} from './utils';

const NAMESPACE = '[FSM]: ';

export const error = {
	transitionForbidden(params: {state: Label; from: Transition<Label>['from']; name: Label}): void {
		const from = guard.array(params.from) ? params.from.join(', ') : params.from;
		const msg = NAMESPACE + `Transition "${params.name}" failed;\nCurrent state is "${params.state}";\nWhile it can only be executed from "${from}";`;
		throw new Error(msg);
	},
	hasPendingTransition(params: {pending: Label; current: Label}): void {
		const msg = NAMESPACE + `Transition "${params.current}" can't be executed;\nAlready has pending transition "${params.pending}";`;
		throw new Error(msg);
	},
};
