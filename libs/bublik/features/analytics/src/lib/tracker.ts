/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { matchPath } from 'react-router-dom';

import { config } from '@/bublik/config';
import { frontendAppVersion } from '@/bublik/features/deploy-info';
import { AnalyticsCollectEventInput } from '@/shared/types';

const ANALYTICS_ENDPOINT = `${config.rootUrl}/api/v2/analytics/collect/`;
const ANON_ID_STORAGE_KEY = 'bublik.analytics.anon-id';
const SESSION_ID_STORAGE_KEY = 'bublik.analytics.session-id';
const FLUSH_INTERVAL_MS = 5000;
const MAX_QUEUE_SIZE = 500;
const MAX_BATCH_SIZE = 50;
const RECENT_TRACKED_GAP_MS = 800;

let queue: AnalyticsCollectEventInput[] = [];
let flushIntervalId: ReturnType<typeof setInterval> | null = null;
let isFlushing = false;
let lastPageKey = '';
let lastPageTrackedAt = 0;
let listenersBound = false;
let isAnalyticsEnabled = false;

const DYNAMIC_ROUTE_PATTERNS = [
	'/auth/forgot_password/password_reset/:userId/:resetToken',
	'/auth/register/activate/:userId/:token',
	'/log/:runId/:old',
	'/log/:runId',
	'/runs/:runId/report',
	'/runs/:runId/results/:resultId/measurements',
	'/runs/:runId'
];

const getSafeRandomId = () => {
	if (
		typeof crypto !== 'undefined' &&
		typeof crypto.randomUUID === 'function'
	) {
		return crypto.randomUUID();
	}

	return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const getOrCreateStorageValue = (
	storage: Storage | null,
	key: string
): string => {
	if (!storage) {
		return getSafeRandomId();
	}

	try {
		const maybeExisting = storage.getItem(key);
		if (maybeExisting) {
			return maybeExisting;
		}

		const value = getSafeRandomId();
		storage.setItem(key, value);
		return value;
	} catch {
		return getSafeRandomId();
	}
};

const getBrowserInfo = () => {
	if (typeof navigator === 'undefined') {
		return {
			browserName: '',
			browserVersion: '',
			osName: '',
			userAgent: ''
		};
	}

	const userAgent = navigator.userAgent;
	const browserMatch =
		userAgent.match(/(Firefox)\/(\d+)/) ||
		userAgent.match(/(Edg)\/(\d+)/) ||
		userAgent.match(/(Chrome)\/(\d+)/) ||
		userAgent.match(/Version\/(\d+).*(Safari)/);
	const osMatch =
		userAgent.match(/(Windows NT [\d.]+)/) ||
		userAgent.match(/(Mac OS X [\d_]+)/) ||
		userAgent.match(/(Linux)/) ||
		userAgent.match(/(Android [\d.]+)/) ||
		userAgent.match(/(iOS [\d_]+)/);

	const isSafariMatch =
		browserMatch?.[0] !== undefined && browserMatch[0].includes('Safari');
	const browserName = isSafariMatch
		? browserMatch?.[2] ?? ''
		: browserMatch?.[1] ?? '';
	const browserVersion = isSafariMatch
		? browserMatch?.[1] ?? ''
		: browserMatch?.[2] ?? '';
	const osName = osMatch?.[1] ?? '';

	return {
		browserName,
		browserVersion,
		osName,
		userAgent
	};
};

const trimText = (value: string | undefined, maxLength: number): string => {
	if (!value) {
		return '';
	}

	if (value.length <= maxLength) {
		return value;
	}

	return value.slice(0, maxLength);
};

const normalizeAnalyticsPath = (pathname: string): string => {
	if (!pathname) {
		return '/';
	}

	const normalizedPath =
		pathname.length > 1 ? pathname.replace(/\/+$/, '') || '/' : pathname;
	const baseUrl =
		config.baseUrl.length > 1 ? config.baseUrl.replace(/\/+$/, '') : '';
	const pathWithoutBase =
		baseUrl && normalizedPath.startsWith(`${baseUrl}/`)
			? normalizedPath.slice(baseUrl.length) || '/'
			: normalizedPath === baseUrl
			? '/'
			: normalizedPath;

	for (const pattern of DYNAMIC_ROUTE_PATTERNS) {
		if (matchPath({ path: pattern, end: true }, pathWithoutBase)) {
			return pattern;
		}
	}

	return pathWithoutBase;
};

const bindGlobalListeners = () => {
	if (listenersBound || typeof window === 'undefined') {
		return;
	}

	window.addEventListener('pagehide', () => {
		void flushQueue({ useBeacon: true });
	});

	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'hidden') {
			void flushQueue({ useBeacon: true });
		}
	});

	listenersBound = true;
};

const startScheduler = () => {
	if (flushIntervalId) {
		return;
	}

	bindGlobalListeners();
	flushIntervalId = setInterval(() => {
		void flushQueue();
	}, FLUSH_INTERVAL_MS);
};

const stopScheduler = () => {
	if (!flushIntervalId) {
		return;
	}

	clearInterval(flushIntervalId);
	flushIntervalId = null;
};

const enqueue = (event: AnalyticsCollectEventInput) => {
	queue.push(event);

	if (queue.length > MAX_QUEUE_SIZE) {
		queue = queue.slice(queue.length - MAX_QUEUE_SIZE);
	}

	if (queue.length >= MAX_BATCH_SIZE) {
		void flushQueue();
	}
};

const sendBatch = async (
	events: AnalyticsCollectEventInput[],
	useBeacon = false
) => {
	const payload = JSON.stringify({ events });

	if (useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
		const body = new Blob([payload], { type: 'application/json' });
		if (navigator.sendBeacon(ANALYTICS_ENDPOINT, body)) {
			return;
		}
	}

	const response = await fetch(ANALYTICS_ENDPOINT, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: payload,
		credentials: 'omit',
		keepalive: useBeacon
	});

	if (!response.ok) {
		throw new Error(`Analytics request failed with status ${response.status}`);
	}
};

const flushQueue = async ({
	useBeacon = false
}: { useBeacon?: boolean } = {}) => {
	if (isFlushing || queue.length === 0) {
		return;
	}

	isFlushing = true;

	const batch = queue.slice(0, MAX_BATCH_SIZE);
	queue = queue.slice(batch.length);

	try {
		await sendBatch(batch, useBeacon);
	} catch {
		queue = [...batch, ...queue].slice(0, MAX_QUEUE_SIZE);
	} finally {
		isFlushing = false;
	}
};

const buildEvent = (
	eventType: string,
	eventName: string,
	path?: string,
	payload?: unknown
): AnalyticsCollectEventInput | null => {
	if (typeof window === 'undefined') {
		return null;
	}

	const anonId = getOrCreateStorageValue(
		window.localStorage,
		ANON_ID_STORAGE_KEY
	);
	const sessionId = getOrCreateStorageValue(
		window.sessionStorage,
		SESSION_ID_STORAGE_KEY
	);
	const browserInfo = getBrowserInfo();

	return {
		event_type: trimText(eventType, 64),
		event_name: trimText(eventName, 128),
		path: trimText(path, 512),
		anon_id: trimText(anonId, 128),
		session_id: trimText(sessionId, 128),
		browser_name: trimText(browserInfo.browserName, 128),
		browser_version: trimText(browserInfo.browserVersion, 64),
		os_name: trimText(browserInfo.osName, 128),
		user_agent: trimText(browserInfo.userAgent, 512),
		app_version: trimText(frontendAppVersion, 64),
		payload,
		occurred_at: new Date().toISOString()
	};
};

const setAnalyticsEnabled = (enabled: boolean) => {
	isAnalyticsEnabled = enabled;

	if (!enabled) {
		queue = [];
		stopScheduler();
	}
};

const trackPageView = ({ path }: { path: string }) => {
	if (!isAnalyticsEnabled) {
		return;
	}

	const normalizedPath = normalizeAnalyticsPath(path);
	const pageKey = normalizedPath;
	const now = Date.now();

	if (
		lastPageKey === pageKey &&
		now - lastPageTrackedAt < RECENT_TRACKED_GAP_MS
	) {
		return;
	}

	lastPageKey = pageKey;
	lastPageTrackedAt = now;

	const event = buildEvent('page_view', 'page_view', normalizedPath);
	if (!event) {
		return;
	}

	startScheduler();
	enqueue(event);
};

const trackEvent = (name: string, payload?: unknown) => {
	console.log(name, payload);
	if (!isAnalyticsEnabled || typeof window === 'undefined') {
		return;
	}

	const event = buildEvent(
		'event',
		name,
		normalizeAnalyticsPath(window.location.pathname),
		payload
	);

	if (!event) return;

	startScheduler();
	enqueue(event);
};

export {
	normalizeAnalyticsPath,
	setAnalyticsEnabled,
	trackEvent,
	trackPageView
};
