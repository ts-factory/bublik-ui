/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect, useState } from 'react';

interface UseProgressiveVisibleCountOptions {
	totalCount: number;
	initialCount: number;
	chunkSize: number;
	idleTimeoutMs?: number;
}

type CancelScheduledRender = () => void;

function scheduleDeferredRender(
	callback: () => void,
	idleTimeoutMs: number
): CancelScheduledRender {
	if (typeof window === 'undefined') return () => undefined;

	if ('requestIdleCallback' in window) {
		const requestIdle = window.requestIdleCallback.bind(window);
		const cancelIdle = window.cancelIdleCallback.bind(window);
		const idleId = requestIdle(callback, { timeout: idleTimeoutMs });

		return () => cancelIdle(idleId);
	}

	const timeoutId = globalThis.setTimeout(callback, 16);

	return () => globalThis.clearTimeout(timeoutId);
}

function useProgressiveVisibleCount(
	options: UseProgressiveVisibleCountOptions
) {
	const { totalCount, initialCount, chunkSize, idleTimeoutMs = 200 } = options;
	const [visibleCount, setVisibleCount] = useState(() =>
		Math.min(totalCount, initialCount)
	);

	useEffect(() => {
		setVisibleCount(Math.min(totalCount, initialCount));
	}, [initialCount, totalCount]);

	useEffect(() => {
		if (visibleCount >= totalCount) return;

		const cancelScheduledRender = scheduleDeferredRender(() => {
			setVisibleCount((current) => Math.min(current + chunkSize, totalCount));
		}, idleTimeoutMs);

		return () => {
			cancelScheduledRender();
		};
	}, [chunkSize, idleTimeoutMs, totalCount, visibleCount]);

	return visibleCount;
}

export { useProgressiveVisibleCount };
