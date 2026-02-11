/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useSyncExternalStore } from 'react';

const subscribers = new Set<() => void>();
let subscriberCount = 0;
let isCtrlPressed = false;

function getIsPressedFromEvent(event: KeyboardEvent) {
	return (event.ctrlKey && !event.metaKey) || event.metaKey;
}

function emitCtrlPressedChange(nextValue: boolean) {
	if (nextValue === isCtrlPressed) return;

	isCtrlPressed = nextValue;
	subscribers.forEach((subscriber) => subscriber());
}

function handleKeyDown(event: KeyboardEvent) {
	emitCtrlPressedChange(getIsPressedFromEvent(event));
}

function handleKeyUp(event: KeyboardEvent) {
	emitCtrlPressedChange(getIsPressedFromEvent(event));
}

function subscribe(subscriber: () => void) {
	subscribers.add(subscriber);

	if (typeof window !== 'undefined' && subscriberCount === 0) {
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);
	}

	subscriberCount += 1;

	return () => {
		subscribers.delete(subscriber);
		subscriberCount -= 1;

		if (typeof window !== 'undefined' && subscriberCount === 0) {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
			isCtrlPressed = false;
		}
	};
}

function getSnapshot() {
	return isCtrlPressed;
}

function getServerSnapshot() {
	return false;
}

const usePlatformSpecificCtrl = () => {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};

export { usePlatformSpecificCtrl };
