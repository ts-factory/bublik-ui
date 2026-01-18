/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import {
	forwardRef,
	useCallback,
	useImperativeHandle,
	useRef,
	useState
} from 'react';

import { PerformanceResponse } from '@/shared/types';
import { ButtonTw, cn, Icon, Skeleton } from '@/shared/tailwind-ui';
import { useMount } from '@/shared/hooks';
import { getErrorMessage } from '@/services/bublik-api';

function PerformanceListEmpty() {
	return (
		<div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-slate-6 bg-slate-1 p-10 text-center">
			<Icon name="TriangleExclamationMark" size={24} className="text-primary" />
			<div className="space-y-1">
				<h3 className="text-base font-semibold text-text-primary">
					No results
				</h3>
				<p className="text-sm text-text-menu">No URLs provided</p>
			</div>
		</div>
	);
}

interface PerformanceListErrorProps {
	error: unknown;
}

function PerformanceListError(props: PerformanceListErrorProps) {
	const { title, description } = getErrorMessage(props.error);

	return (
		<div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-slate-6 bg-slate-1 p-10 text-center">
			<Icon
				name="TriangleExclamationMark"
				size={24}
				className="text-text-unexpected"
			/>
			<div className="space-y-1">
				<h3 className="text-base font-semibold text-text-primary">{title}</h3>
				<p className="text-sm text-text-menu">{description}</p>
			</div>
		</div>
	);
}

function PerformanceListLoading() {
	return (
		<div className="flex flex-col gap-4 w-full">
			<ul className="flex flex-col gap-2">
				{Array.from({ length: 5 }).map((_, idx) => (
					<Skeleton key={idx} className="h-[38px] rounded" />
				))}
			</ul>
			<ButtonTw>Check</ButtonTw>
		</div>
	);
}

interface PerformanceListProps {
	urls: PerformanceResponse;
}

function PerformanceList(props: PerformanceListProps) {
	const refs = useRef<Map<string, CheckURLHandle>>(new Map());
	const [isInProgress, setIsInProgress] = useState(false);

	async function checkURLs() {
		setIsInProgress(true);
		try {
			const promises = Array.from(refs.current.values()).map((handle) =>
				handle.check()
			);

			await Promise.allSettled(promises);
		} finally {
			setIsInProgress(false);
		}
	}

	useMount(() => checkURLs());

	return (
		<div className="flex flex-col gap-4">
			<ul className="flex flex-col gap-2">
				{props.urls
					.filter(({ url }) => Boolean(url))
					.map(({ label, url, timeout }) => (
						<PerformanceListItem
							key={`${label}_${url}_${timeout}`}
							label={label}
							url={url!}
							timeout={timeout}
							ref={(handle) => {
								if (!handle) return;

								refs.current.set(handle.url, handle);
							}}
						/>
					))}
			</ul>
			<ButtonTw onClick={checkURLs} disabled={isInProgress}>
				Check
			</ButtonTw>
		</div>
	);
}

type TestURLResult = { responseTime: number };
type TestURLFetchStatus = 'passed' | 'failed' | 'idle' | 'loading';

interface TestUrlConfig {
	url: string;
	/* In seconds */
	timeout: number;
	onError: (result: TestURLResult) => void;
	onSuccess: (result: TestURLResult) => void;
}

async function testUrl(config: TestUrlConfig): Promise<TestURLResult> {
	const { url, onSuccess, onError, timeout } = config;
	const start = Date.now();
	try {
		const result = await fetch(url, {
			signal: AbortSignal.timeout(timeout * 1000)
		});
		const responseTime = (Date.now() - start) / 1000;
		const checkResult = { responseTime };

		if (result.status !== 200) {
			onError(checkResult);
			return checkResult;
		}

		onSuccess(checkResult);
		return { responseTime };
	} catch (e) {
		const responseTime = (Date.now() - start) / 1000;
		const checkResult = { responseTime };
		onError(checkResult);
		return checkResult;
	}
}

type CheckURLHandle = {
	check: () => Promise<void>;
	url: string;
};

const INITIAL_STATE = { responseTime: undefined, status: 'idle' } as const;
const LOADING_STATE = { responseTime: undefined, status: 'loading' } as const;

interface PerformanceListItemProps {
	label: string;
	url: string;
	timeout: number;
}

const PerformanceListItem = forwardRef<
	CheckURLHandle,
	PerformanceListItemProps
>(({ url, label, timeout }, ref) => {
	const [fetchStatus, setFetchStatus] = useState<{
		status: TestURLFetchStatus;
		responseTime: number | undefined;
	}>(INITIAL_STATE);

	const checkURL = useCallback(async () => {
		setFetchStatus(LOADING_STATE);

		await testUrl({
			url,
			timeout,
			onSuccess: ({ responseTime }) =>
				setFetchStatus({ responseTime, status: 'passed' }),
			onError: ({ responseTime }) =>
				setFetchStatus({ responseTime, status: 'failed' })
		});
	}, [timeout, url]);

	useImperativeHandle(ref, () => ({ check: checkURL, url }), [checkURL, url]);

	const isLoading = fetchStatus.status === 'loading';
	const isPassed = fetchStatus.status === 'passed';
	const isFailed = fetchStatus.status === 'failed';

	return (
		<li
			key={label}
			className={cn(
				'flex items-center gap-2 border border-border-primary rounded px-3 py-1.5 text-sm',
				isFailed && 'bg-bg-fillError'
			)}
		>
			<div
				className={cn(
					'w-3 h-3 rounded-full shrink-0',
					isLoading && 'bg-gray-300',
					isPassed && 'bg-bg-ok',
					isFailed && 'bg-bg-error'
				)}
			/>
			<a
				className="flex-1 hover:underline text-primary text-sm"
				href={url}
				target={'_blank'}
				rel="noreferrer"
			>
				{label} ({timeout}s)
			</a>
			<span className="tabular-nums text-xs text-text-menu w-[8ch] text-right">
				{`${
					fetchStatus.responseTime ? fetchStatus.responseTime.toFixed(2) : ''
				}${fetchStatus.responseTime ? 's' : ''}`}
				{isLoading ? (
					<Skeleton className="rounded-md h-[14px] w-[8ch]" />
				) : null}
			</span>
		</li>
	);
});

export {
	PerformanceListEmpty,
	PerformanceListLoading,
	PerformanceListError,
	PerformanceList
};
