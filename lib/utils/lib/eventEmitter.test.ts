import {makeEventEmitter} from './eventEmitter';

describe('eventEmitter', () => {
	let emitter = makeEventEmitter<{
		noArgs: never[];
		withArgs: [number, string];
	}>();

	beforeEach(() => {
		emitter = makeEventEmitter();
	});

	describe('listen', () => {
		test('one listener', () => {
			const listener = jest.fn();
			emitter.listen('noArgs', listener);
			emitter.emit('noArgs');
			expect(listener.mock.calls).toHaveLength(1);
		});

		test('multiple listeners for different events', () => {
			const listener1 = jest.fn();
			const listener2 = jest.fn();
			emitter.listen('noArgs', listener1);
			emitter.listen('withArgs', listener2);
			emitter.emit('noArgs');
			emitter.emit('withArgs', 1, '1');
			expect(listener1.mock.calls).toHaveLength(1);
			expect(listener2.mock.calls).toHaveLength(1);
			expect(listener2.mock.calls[0]).toEqual([1, '1']);
		});

		test('multiple listeners for single event', () => {
			const listener1 = jest.fn();
			const listener2 = jest.fn();
			emitter.listen('noArgs', listener1);
			emitter.listen('noArgs', listener2);
			emitter.emit('noArgs');
			expect(listener1.mock.calls).toHaveLength(1);
			expect(listener2.mock.calls).toHaveLength(1);
		});
	});

	describe('unlisten', () => {
		test('unlisten returned from listen', () => {
			const listener = jest.fn();
			const unlisten = emitter.listen('noArgs', listener);
			unlisten();
			emitter.emit('noArgs');
			expect(listener.mock.calls).toHaveLength(0);
		});

		test('separate unlisten', () => {
			const listener = jest.fn();
			emitter.listen('noArgs', listener);
			emitter.unlisten('noArgs', listener);
			emitter.emit('noArgs');
			expect(listener.mock.calls).toHaveLength(0);
		});

		test('all', () => {
			const listener = jest.fn();
			const listener2 = jest.fn();
			emitter.listen('noArgs', listener);
			emitter.listen('noArgs', listener2);
			emitter.unlistenAll('noArgs');
			emitter.emit('noArgs');
			expect(listener.mock.calls).toHaveLength(0);
			expect(listener2.mock.calls).toHaveLength(0);
		});
	});
});
