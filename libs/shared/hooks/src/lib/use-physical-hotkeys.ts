/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { UseHotkeyOptions } from '@tanstack/react-hotkeys';

import { isFocusInInput } from '@/shared/utils';

type PhysicalHotkeyCallback = (event: KeyboardEvent) => void;

interface PhysicalHotkeyOptions
	extends Pick<
		UseHotkeyOptions,
		| 'enabled'
		| 'eventType'
		| 'ignoreInputs'
		| 'preventDefault'
		| 'requireReset'
		| 'stopPropagation'
		| 'target'
	> {
	altKey?: boolean;
	ctrlKey?: boolean;
	metaKey?: boolean;
	shiftKey?: boolean;
}

interface PhysicalHotkeyDefinition {
	code: string;
	callback: PhysicalHotkeyCallback;
	options?: PhysicalHotkeyOptions;
}

function getTarget(
	target: PhysicalHotkeyOptions['target']
): HTMLElement | Document | Window | undefined {
	if (!target) return document;

	if ('current' in target) {
		return (target as RefObject<HTMLElement | null>).current ?? undefined;
	}

	return target;
}

function matchesModifiers(
	event: KeyboardEvent,
	options: PhysicalHotkeyOptions
) {
	return (
		event.altKey === Boolean(options.altKey) &&
		event.ctrlKey === Boolean(options.ctrlKey) &&
		event.metaKey === Boolean(options.metaKey) &&
		event.shiftKey === Boolean(options.shiftKey)
	);
}

function isEventFromInput(event: KeyboardEvent) {
	return event.target instanceof Element && isFocusInInput(event);
}

function usePhysicalHotkeys(
	hotkeys: PhysicalHotkeyDefinition[],
	commonOptions: PhysicalHotkeyOptions = {}
) {
	const hotkeysRef = useRef(hotkeys);
	const commonOptionsRef = useRef(commonOptions);

	hotkeysRef.current = hotkeys;
	commonOptionsRef.current = commonOptions;

	useEffect(() => {
		const target = getTarget(commonOptions.target);
		const eventType = commonOptions.eventType ?? 'keydown';
		const firedCodes = new Set<string>();

		if (!target) return undefined;

		function handleKeyEvent(event: Event) {
			if (!(event instanceof KeyboardEvent)) return;

			for (const hotkey of hotkeysRef.current) {
				const options = {
					...commonOptionsRef.current,
					...hotkey.options
				};

				if (options.enabled === false) continue;
				if (event.code !== hotkey.code) continue;
				if (!matchesModifiers(event, options)) continue;
				if ((options.ignoreInputs ?? true) && isEventFromInput(event)) continue;
				if (options.requireReset && firedCodes.has(hotkey.code)) continue;

				if (options.preventDefault ?? true) event.preventDefault();
				if (options.stopPropagation ?? true) event.stopPropagation();

				firedCodes.add(hotkey.code);
				hotkey.callback(event);
				return;
			}
		}

		function handleKeyUp(event: Event) {
			if (event instanceof KeyboardEvent) firedCodes.delete(event.code);
		}

		target.addEventListener(eventType, handleKeyEvent);
		target.addEventListener('keyup', handleKeyUp);

		return () => {
			target.removeEventListener(eventType, handleKeyEvent);
			target.removeEventListener('keyup', handleKeyUp);
		};
	}, [commonOptions.eventType, commonOptions.target]);
}

export { usePhysicalHotkeys };
export type { PhysicalHotkeyDefinition, PhysicalHotkeyOptions };
