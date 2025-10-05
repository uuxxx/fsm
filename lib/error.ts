import type {Label} from './types/Label';
import type {Transition} from './types/Transition';
import {guard} from './utils';

const NAMESPACE = '[FSM]: ';

export const error = {
	transitionForbidden(params: {state: Label; from: Transition<Label>['from']; name: Label}): void {
		const from = guard.array(params.from) ? params.from.join(', ') : params.from;
		const msg = NAMESPACE + `Transition "${params.name}" failed;\ncurrent state is "${params.state}";\nwhile it can only be executed from "${from}";`;
		throw new Error(msg);
	},
};
