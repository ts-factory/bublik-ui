/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, useCallback, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { MeasurementsRouterParams } from '@/shared/types';
import { useIsSticky } from '@/shared/hooks';
import { CardHeader, cn } from '@/shared/tailwind-ui';
import { LockButton, TableHeader } from '@/shared/charts';

import {
	ChartsContainer,
	ExportChartContainer,
	MeasurementStatisticsContainer,
	TablesContainer
} from '../../containers';

const getStickyClass = (
	isSticky: boolean,
	isLockedMode: boolean
): string | undefined => {
	const stickyClass =
		'sticky top-[-36px] z-10 border-b border-border-primary rounded-none';
	const notStickyClass = 'sticky top-[-36px] z-10';

	if (!isLockedMode) return undefined;

	if (isSticky) return stickyClass;

	return notStickyClass;
};

export const ModeDefault: FC = () => {
	const { runId, resultId } = useParams<MeasurementsRouterParams>();
	const chartsRef = useRef<HTMLDivElement>(null);
	const { isSticky } = useIsSticky(chartsRef, { offset: 34 });
	const [isLockedMode, setIsLockedMode] = useState(false);

	const toggleMode = useCallback(() => setIsLockedMode((p) => !p), []);

	const chartsHeight = chartsRef?.current?.clientHeight || 0;

	if (!runId || !resultId) return null;

	return (
		<div className="p-2">
			<div className="flex flex-col gap-1">
				<MeasurementStatisticsContainer />
				<div
					className={cn(
						'relative transition-all bg-white rounded-md',
						getStickyClass(isSticky, isLockedMode)
					)}
					ref={chartsRef}
				>
					<CardHeader label="Charts">
						<LockButton isLockedMode={isLockedMode} onClick={toggleMode} />
					</CardHeader>
					<ChartsContainer
						layout="mosaic"
						resultId={resultId}
						isLockedMode={isLockedMode}
					/>
				</div>
				<div className="bg-white rounded-md">
					<TableHeader>
						<ExportChartContainer resultId={resultId} />
					</TableHeader>
					<TablesContainer
						resultId={resultId}
						isLockedMode={isLockedMode}
						chartsHeight={chartsHeight}
					/>
				</div>
			</div>
		</div>
	);
};
