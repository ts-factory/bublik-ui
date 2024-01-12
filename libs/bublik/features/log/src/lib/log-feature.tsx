/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, ReactNode, useEffect } from 'react';
import { skipToken } from '@reduxjs/toolkit/dist/query';

import { formatTimeToDot } from '@/shared/utils';
import {
	Resizable,
	resizableStyles,
	CardHeader,
	cn,
	ButtonTw
} from '@/shared/tailwind-ui';
import {
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
import { useIsLogExperimental, useLogPage } from './hooks';

export interface LogFeatureProps {
	runId?: string;
	isTreeShown?: boolean;
	children?: ReactNode;
}

export const LogFeature: FC<LogFeatureProps> = ({
	runId,
	children,
	isTreeShown
}) => {
	const { data: details } = useGetRunDetailsQuery(runId ?? skipToken);
	const { data: tree } = useGetTreeByRunIdQuery(runId ?? skipToken);
	const [isExperimentalLog, toggleExperimentalLog] = useIsLogExperimental();
	const { focusId } = useLogPage();

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
			<div className="flex flex-col flex-grow h-full gap-1">
				{children}
				<main className="flex-grow bg-white rounded-md overflow-hidden">
					<CardHeader label="Log">
						<div className="flex items-center gap-2">
							<ButtonTw
								variant="secondary"
								state={isExperimentalLog && 'active'}
								size="xss"
								onClick={toggleExperimentalLog}
							>
								Experimental
							</ButtonTw>
							<LinkToRun runId={runId} />
							<LinkToHistoryContainer runId={runId} focusId={focusId} />
							<LinkToMeasurementsContainer focusId={focusId} />
							<LinkToSourceContainer runId={runId} />
						</div>
					</CardHeader>
					<div
						className={cn(
							'overflow-auto relative h-full',
							isExperimentalLog ? 'h-[calc(100%-36px)]' : 'h-[calc(100%-20px)]'
						)}
					>
						<LogPickerContainer />
					</div>
				</main>
			</div>
		</>
	);
};
