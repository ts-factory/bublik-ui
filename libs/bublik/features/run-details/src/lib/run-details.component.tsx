/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';

import { DetailsItem, RUN_STATUS } from '@/shared/types';
import { parseDetailDate, trimBranch } from '@/shared/utils';
import { Skeleton, ConclusionBadge } from '@/shared/tailwind-ui';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';

import {
	prepareRevisions,
	prepareInfoListItems,
	prepareDuration,
	prepareTags
} from './utils';
import { DetailItem } from './detail-item';
import { InfoList } from './info-list';

import { InfoListItem } from './info-list/list-item';
import styles from './run-details.module.scss';
import { RunCommentFormContainer } from './run-comment.container';

export const RunDetailsLoading = () => {
	return (
		<div className="flex flex-grow h-full p-2 min-h-52">
			<Skeleton className="flex-grow rounded" />
		</div>
	);
};

export const RunDetailsEmpty = () => {
	return (
		<BublikEmptyState
			title="No data"
			description="Run details are not available"
		/>
	);
};

export interface RunDetailsErrorProps {
	error?: unknown;
}

export const RunDetailsError = ({ error = {} }: RunDetailsErrorProps) => {
	return <BublikErrorState error={error} iconSize={48} />;
};

const RUN_ID_LABEL = 'Run ID';

export interface RunDetailsMainInfoProps {
	isFullMode?: RunDetailsProps['isFullMode'];
	runStartDate: string | null;
	runStatus: RunDetailsProps['runStatus'];
	runId: RunDetailsProps['runId'];
	mainPackage: RunDetailsProps['mainPackage'];
	runFinishDate: string | null;
	runDuration: string | null;
	statusByNok: string | null;
	status: string | null;
	conclusionReason?: string | null;
}

const RunDetailsMainInfo = (props: RunDetailsMainInfoProps) => {
	const {
		isFullMode,
		runStartDate,
		runStatus,
		runId,
		mainPackage,
		runFinishDate,
		runDuration,
		statusByNok,
		status,
		conclusionReason
	} = props;

	if (!isFullMode) {
		return (
			<dl className="grid items-center grid-cols-[max-content,max-content] gap-y-2 gap-x-4">
				<DetailItem label={RUN_ID_LABEL} value={runId} isCopyable />
				<DetailItem label="Start" value={runStartDate} />
				<DetailItem
					label="Conclusion"
					value={<ConclusionBadge status={runStatus} />}
				/>
			</dl>
		);
	}

	return (
		<dl className="grid items-center grid-cols-[max-content,max-content] gap-y-2 gap-x-4">
			<DetailItem label={RUN_ID_LABEL} value={runId} isCopyable />
			<DetailItem label="Main package" value={mainPackage} />
			<DetailItem label="Start" value={runStartDate} />
			<DetailItem label="Finish" value={runFinishDate} />
			<DetailItem label="Duration" value={runDuration} />
			<DetailItem label="Status" value={status} />
			<DetailItem label="Status by NOK" value={statusByNok} />
			<DetailItem
				label="Conclusion"
				value={<ConclusionBadge status={runStatus} />}
			/>
			{conclusionReason ? (
				<DetailItem label="Conclusion Reason" value={conclusionReason} />
			) : null}
		</dl>
	);
};

export interface RunDetailsTagsProps {
	isFullMode?: RunDetailsProps['isFullMode'];
	runBranches: InfoListItem[];
	importantRunTags: InfoListItem[];
	revisions: InfoListItem[];
	runLabels: InfoListItem[];
	combinedRunTags: InfoListItem[];
}

const RunDetailsTags = (props: RunDetailsTagsProps) => {
	const {
		isFullMode,
		runBranches,
		importantRunTags,
		combinedRunTags,
		runLabels,
		revisions
	} = props;

	if (!isFullMode) {
		return (
			<>
				<InfoList label="Branches" items={runBranches} formatter={trimBranch} />
				<InfoList label="Important" items={importantRunTags} />
			</>
		);
	}

	return (
		<>
			<InfoList label="Branches" items={runBranches} formatter={trimBranch} />
			<InfoList label="Revisions" items={revisions} />
			<InfoList label="Labels" items={runLabels} />
			<InfoList label="Tags" items={combinedRunTags} />
		</>
	);
};

export interface RunDetailsProps {
	isFullMode?: boolean;
	runId: number;
	mainPackage: string;
	start: string;
	finish: string;
	duration: string;
	isCompromised: boolean;
	importantTags: string[];
	relevantTags: string[];
	branches: string[];
	labels: string[];
	revisions: DetailsItem[];
	specialCategories: Record<string, string[]>;
	runStatus: RUN_STATUS;
	status: string;
	statusByNok: string;
	isFetching?: boolean;
	conclusionReason?: string | null;
	runComment?: string;
}

function RunDetails(props: RunDetailsProps) {
	const {
		isFullMode,
		runId,
		mainPackage,
		start,
		finish,
		duration,
		runStatus,
		branches,
		revisions,
		labels,
		relevantTags,
		importantTags,
		specialCategories,
		status,
		statusByNok,
		isFetching,
		conclusionReason,
		runComment
	} = props;

	const data = useMemo(() => {
		const runStartDate = parseDetailDate(start);
		const runFinishDate = parseDetailDate(finish);
		const runDuration = prepareDuration(duration);
		const runRevisions = prepareRevisions(revisions, 'bg-badge-2');
		const runTags = prepareTags(importantTags, relevantTags);
		const runLabels = prepareInfoListItems({
			backgroundColor: 'bg-badge-10'
		})(labels);
		const runBranches = prepareInfoListItems({
			backgroundColor: 'bg-badge-16'
		})(branches);

		return {
			runStartDate,
			runFinishDate,
			runDuration,
			runRevisions,
			runTags,
			runLabels,
			runBranches
		} as const;
	}, [
		branches,
		duration,
		finish,
		importantTags,
		labels,
		relevantTags,
		revisions,
		start
	]);

	return (
		<div className={isFetching ? 'w-full opacity-40 select-none' : 'w-full'}>
			<div className={styles['grid']}>
				<div
					className={`${styles['grid-item']} ${
						isFullMode ? styles['grid-item-full'] : styles['grid-item-collapse']
					}`}
				>
					<RunDetailsMainInfo
						isFullMode={isFullMode}
						runStartDate={data.runStartDate}
						runStatus={runStatus}
						conclusionReason={conclusionReason}
						runId={runId}
						mainPackage={mainPackage}
						runFinishDate={data.runFinishDate}
						runDuration={data.runDuration}
						statusByNok={statusByNok}
						status={status}
					/>
				</div>
				<div className={styles['grid-tags']}>
					<div className="flex flex-col gap-2">
						<RunDetailsTags
							isFullMode={isFullMode}
							runBranches={data.runBranches}
							importantRunTags={data.runTags.important}
							revisions={data.runRevisions}
							runLabels={data.runLabels}
							combinedRunTags={data.runTags.combined}
						/>
					</div>
				</div>
				{Object.entries(specialCategories).length ? (
					<div className={isFullMode ? styles['span-1'] : styles['span-2']}>
						<div className={`flex flex-col gap-2 ${styles['collapse']}`}>
							{Object.entries(specialCategories).map(([label, items]) => (
								<InfoList
									key={label}
									label={label}
									items={prepareInfoListItems({
										backgroundColor: 'bg-badge-4'
									})(items)}
								/>
							))}
						</div>
					</div>
				) : null}
				<div className="p-4 col-span-full border-t border-border-primary">
					<RunCommentFormContainer
						runId={runId}
						defaultValues={{ comment: runComment ?? '' }}
					/>
				</div>
			</div>
		</div>
	);
}

export { RunDetails };
