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
		<div className="flex flex-col gap-2">
			<h2 className="text-xl font-semibold">Health Check</h2>
			<div className="rounded-md grid place-items-center min-h-[80vh]">
				<div className="grid place-items-center h-[calc(100vh-256px)]">
					<div className="flex flex-col items-center text-center">
						<Icon
							name="TriangleExclamationMark"
							size={24}
							className="text-primary"
						/>
						<h3 className="mt-2 text-sm font-medium text-gray-900">
							No results
						</h3>
						<p className="mt-1 text-sm text-gray-500">No URLs provided</p>
					</div>
				</div>
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
		<div className="flex flex-col gap-2">
			<h2 className="text-xl font-semibold">Health Check</h2>
			<div className="grid place-items-center h-[calc(100vh-256px)]">
				<div className="flex flex-col items-center text-center">
					<Icon
						name="TriangleExclamationMark"
						size={24}
						className="text-text-unexpected"
					/>
					<h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
					<p className="mt-1 text-sm text-gray-500">{description}</p>
				</div>
			</div>
		</div>
	);
}

function PerformanceListLoading() {
	return (
		<div className="flex flex-col gap-2 w-full">
			<h2 className="text-xl font-semibold">Health Check</h2>
			<ul className={'flex flex-col gap-2'}>
				{Array.from({ length: 10 }).map((_, idx) => (
					<Skeleton
						key={idx}
						className="flex items-center gap-2 justify-between border border-border-primary rounded px-4 py-2 h-[42px]"
					/>
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
		<div className="flex flex-col gap-2">
			<h2 className="text-xl font-semibold">Health Check</h2>
			<ul className={'flex flex-col gap-2'}>
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

type TestURLResultCommon = { responseTime: number };
type TestURLSuccess = TestURLResultCommon;
type TestURLError = TestURLResultCommon;
type TestURLResult = TestURLSuccess | TestURLError;
type TestURLFetchStatus = 'passed' | 'failed' | 'idle' | 'loading';

interface TestUrlConfig {
	url: string;
	/* In seconds */
	timeout: number;
	onError: (result: TestURLError) => void;
	onSuccess: (result: TestURLSuccess) => void;
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
				'flex items-center gap-2 justify-between border border-border-primary rounded px-4 py-2',
				isFailed && 'bg-bg-fillError'
			)}
		>
			<a
				className="flex-1 flex-shrink-0 hover:underline text-primary"
				href={url}
				target={'_blank'}
				rel="noreferrer"
			>
				{label} ({timeout}s)
			</a>
			<span className="tabular-nums w-[8ch] flex-1">
				{`${
					fetchStatus.responseTime ? fetchStatus.responseTime.toFixed(2) : ''
				}${fetchStatus.responseTime ? 's' : ''}`}
				{isLoading ? (
					<Skeleton className="rounded-md h-[16px] w-[8ch] flex-1" />
				) : null}
			</span>
			<div
				className={cn(
					'w-3 h-3 rounded-full relative',
					isLoading && 'bg-gray-300',
					isPassed && 'bg-bg-ok',
					isFailed && 'bg-bg-error'
				)}
			/>
		</li>
	);
});

export {
	PerformanceListEmpty,
	PerformanceListLoading,
	PerformanceListError,
	PerformanceList
};
