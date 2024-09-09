/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ReactNode, useEffect, useRef } from 'react';
import { skipToken } from '@reduxjs/toolkit/dist/query';

import { formatTimeToDot } from '@/shared/utils';
import {
	Resizable,
	CardHeader,
	ButtonTw,
	resizableStyles,
	cn,
	NewBugButton
} from '@/shared/tailwind-ui';
import {
	useGetLogJsonQuery,
	useGetRunDetailsQuery,
	useGetTreeByRunIdQuery
} from '@/services/bublik-api';

import {
	LogPickerContainer,
	LinkToHistoryContainer,
	LinkToSourceContainer,
	LinkToMeasurementsContainer,
	TreeContainer
} from './containers';
import { LinkToRun } from './components';
import { useIsLogLegacy, useLogPage } from './hooks';

export interface LogFeatureProps {
	runId?: string;
	isTreeShown?: boolean;
	children?: ReactNode;
}

export const LogFeature = (props: LogFeatureProps) => {
	const { runId, children, isTreeShown } = props;
	const { data: details } = useGetRunDetailsQuery(runId ?? skipToken);
	const { data: tree } = useGetTreeByRunIdQuery(runId ?? skipToken);
	const { isLegacyLog, toggleLog } = useIsLogLegacy();
	const { focusId, isShowingRunLog, page } = useLogPage();
	const scrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!details) {
			document.title = 'Log - Bublik';
			return;
		}

		const { main_package: name, start } = details;
		const formattedTime = formatTimeToDot(start);
		const focusedTestName = focusId ? tree?.tree?.[focusId].name : '';

		document.title = `${
			focusedTestName ? `${focusedTestName} - ` : ''
		}${name} | ${formattedTime} | ${runId} | Log - Bublik`;
	}, [details, runId, focusId, tree?.tree]);

	useEffect(() => {
		scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
	}, [focusId]);

	const name = focusId
		? tree?.tree[focusId].name ?? ''
		: tree?.tree[tree?.mainPackage].name ?? '';

	const idToFetch = isShowingRunLog
		? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		  { id: runId! }
		: focusId
		? { id: focusId, page }
		: skipToken;

	const { data } = useGetLogJsonQuery(idToFetch);
	const path = `/${tree?.tree[focusId ?? tree.mainPackage].path}` ?? '';

	const parameters =
		data?.root
			.flatMap((b) => b.content)
			.filter((b) => b.type === 'te-log-meta')
			.map((meta) => meta.meta.parameters)
			.filter((v) => !!v)
			.flat()
			.map((p) => `${p.name}=${p.value}`) ?? [];
	const verdicts =
		data?.root
			.flatMap((b) => b.content)
			.filter((b) => b.type === 'te-log-meta')
			.map((meta) => meta.meta.verdicts)
			.filter((v) => !!v)
			.flat()
			.map((v) => v.verdict) ?? [];

	const link = new URL(window.location.href);
	link.searchParams.delete('rowState');

	if (!runId) return null;

	return (
		<>
			{isTreeShown && (
				<Resizable
					{...resizableStyles}
					className="flex overflow-visible"
					enable={{ right: true }}
					defaultSize={{ width: 325, height: '100%' }}
					minWidth={300}
					maxWidth={1000}
				>
					<TreeContainer runId={runId} />
				</Resizable>
			)}
			<div className="flex flex-col flex-grow h-full gap-1 overflow-hidden">
				{children}
				<main className="flex-grow bg-white rounded-md overflow-hidden">
					<CardHeader label="Log">
						<div className="flex items-center gap-2">
							<ButtonTw
								variant="secondary"
								state={isLegacyLog && 'active'}
								size="xss"
								onClick={toggleLog}
							>
								Legacy
							</ButtonTw>
							<LinkToRun runId={runId} />
							<LinkToHistoryContainer runId={runId} focusId={focusId} />
							<LinkToMeasurementsContainer focusId={focusId} />
							<LinkToSourceContainer runId={runId} />
							<NewBugButton
								link={link.href}
								path={path}
								name={name}
								verdicts={verdicts}
								tags={{
									branches: details?.branches ?? [],
									parameters,
									specialCategories: details?.special_categories ?? {},
									important: details?.important_tags ?? [],
									revisions: details?.revisions ?? []
								}}
							/>
						</div>
					</CardHeader>
					<div
						className={cn(
							'overflow-auto relative h-full',
							!isLegacyLog ? 'h-[calc(100%-36px)]' : 'h-[calc(100%-20px)]'
						)}
						ref={scrollRef}
					>
						<LogPickerContainer />
					</div>
				</main>
			</div>
		</>
	);
};
