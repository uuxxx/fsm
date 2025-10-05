import type {Label} from './types/Label';

const NAMESPACE = '[FSM]: ';

export const error = {
	transitionForbidden(params: {state: Label; from: Label; name: Label}): void {
		const msg = NAMESPACE + `Transition "${params.name}" failed;\ncurrent state is "${params.state}";\nwhile it can only be executed from "${params.from}";`;
		throw new Error(msg);
	},
};
