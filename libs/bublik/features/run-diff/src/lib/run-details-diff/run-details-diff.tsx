/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';
import { ArrayChange, diffArrays, diffWords } from 'diff';

import { useGetRunDetailsQuery } from '@/services/bublik-api';
import { cn, infoListItemStyles, Skeleton } from '@/shared/tailwind-ui';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';

import { getDiffProps } from './run-details-diff.utils';
import { MetadataValue, MetaDiff } from './run-details-diff.types';

export interface RunDetailsContainerProps {
	leftRunId: string;
	rightRunId: string;
}

export const RunDetailsDiffContainer = (props: RunDetailsContainerProps) => {
	const {
		data: leftData,
		isLoading: isLeftLoading,
		error: leftError
	} = useGetRunDetailsQuery(props.leftRunId);
	const {
		data: rightData,
		isLoading: isRightLoading,
		error: rightError
	} = useGetRunDetailsQuery(props.rightRunId);

	const diffProps = useMemo(
		() => getDiffProps({ leftData, rightData }),
		[leftData, rightData]
	);

	const isLoading = isLeftLoading || isRightLoading;
	const error = leftError || rightError;

	if (isLoading) return <RunDetailsDiffLoading />;

	if (error) return <RunDetailsDiffError error={error} />;

	if (!leftData || !rightData) {
		return (
			<BublikEmptyState
				title="No data"
				description="Run details are not available"
			/>
		);
	}

	return <RunDetailsDiff {...diffProps} />;
};

export const RunDetailsDiffLoading = () => {
	return (
		<div className="flex-grow p-4">
			<Skeleton className="h-full rounded" />
		</div>
	);
};

export const RunDetailsDiffError = (props: { error: unknown }) => {
	return <BublikErrorState error={props.error} iconSize={48} />;
};

export interface RunDetailsDiffProps {
	sharedMeta: MetaDiff[];
	projectMeta: MetaDiff[];
}

export const RunDetailsDiff = (props: RunDetailsDiffProps) => {
	return (
		<div className="py-4">
			<div className="flex flex-col gap-4">
				{props.sharedMeta.map((meta) => (
					<div key={meta.label} className="flex flex-col gap-2">
						<span className="px-4 text-sm font-medium text-text-primary">
							{meta.label}
						</span>
						<div>
							<MetadataDiff {...meta} />
						</div>
					</div>
				))}
				{props.projectMeta.map((meta) => (
					<div key={meta.label} className="flex flex-col gap-2">
						<span className="px-4 text-sm font-medium text-text-primary">
							{meta.label}
						</span>
						<div>
							<MetadataDiff {...meta} />
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export interface TagDiffProps {
	left?: MetadataValue;
	right?: MetadataValue;
}

const TagDiff = ({ left, right }: TagDiffProps) => {
	if (!left || !right) return null;

	const diff = diffWords(left.value, right.value);

	return (
		<div className="flex flex-col gap-1">
			{left.url ? (
				<a
					className={infoListItemStyles({
						className: left.className,
						isLink: true
					})}
					href={left.url}
					target="_blank"
					rel="noreferrer"
				>
					{diff
						.filter((change) => change.removed || !change.added)
						.map((change, idx) => (
							<span
								key={idx}
								className={cn(
									change.added && 'bg-green-300 text-black border-transparent',
									change.removed && 'bg-red-300 text-black border-transparent'
								)}
							>
								{change.value.replace('=', ': ')}
							</span>
						))}
				</a>
			) : (
				<div
					className={infoListItemStyles({
						className: left.className
					})}
				>
					{diff
						.filter((change) => change.removed || !change.added)
						.map((change, idx) => (
							<span
								key={idx}
								className={cn(
									change.added && 'bg-green-300 text-black border-transparent',
									change.removed && 'bg-red-300 text-black border-transparent'
								)}
							>
								{change.value.replace('=', ': ')}
							</span>
						))}
				</div>
			)}
			{right.url ? (
				<a
					className={infoListItemStyles({
						className: right.className,
						isLink: true
					})}
					href={right.url}
					target="_blank"
					rel="noreferrer"
				>
					{diff
						.filter((change) => change.added || !change.removed)
						.map((change, idx) => (
							<span
								key={idx}
								className={cn(
									change.added && 'bg-green-300 text-black border-transparent',
									change.removed && 'bg-red-300 text-black border-transparent'
								)}
							>
								{change.value.replace('=', ': ')}
							</span>
						))}
				</a>
			) : (
				<div
					className={infoListItemStyles({
						className: right.className
					})}
				>
					{diff
						.filter((change) => change.added || !change.removed)
						.map((change, idx) => (
							<span
								key={idx}
								className={cn(
									change.added && 'bg-green-300 text-black border-transparent',
									change.removed && 'bg-red-300 text-black border-transparent'
								)}
							>
								{change.value.replace('=', ': ')}
							</span>
						))}
				</div>
			)}
		</div>
	);
};

export interface MultipleDiffProps {
	change: ArrayChange<MetadataValue>;
	allValuesWithDiff: Array<string | undefined>;
}

const MultipleDiff = (props: MultipleDiffProps) => {
	return (
		<>
			{props.change.value
				.filter((meta) => !props.allValuesWithDiff.includes(meta.value))
				.map((meta) => {
					if (meta.url) {
						return (
							<a
								key={meta.value}
								className={cn(
									infoListItemStyles({ isLink: Boolean(meta.url) }),
									meta.className ? meta.className : 'bg-badge-0',
									props.change.added &&
										'bg-green-300 text-black border-transparent',
									props.change.removed &&
										'bg-red-300 text-black border-transparent'
								)}
								href={meta.url}
								target="_blank"
								rel="noreferrer"
							>
								{meta.value.replace('=', ': ')}
							</a>
						);
					}

					return (
						<div
							key={meta.value}
							className={cn(
								infoListItemStyles({ isLink: Boolean(meta.url) }),
								meta.className ? meta.className : 'bg-badge-0',
								props.change.added &&
									'bg-green-300 text-black border-transparent',
								props.change.removed &&
									'bg-red-300 text-black border-transparent'
							)}
						>
							{meta.value.replace('=', ': ')}
						</div>
					);
				})}
		</>
	);
};

export interface MetadataDiffProps {
	label: string;
	left: MetadataValue[];
	right: MetadataValue[];
}

export const MetadataDiff = (props: MetadataDiffProps) => {
	const diff = useMemo(
		() =>
			diffArrays(props.left, props.right, {
				comparator: (left, right) =>
					left.value.toLowerCase() === right.value.toLowerCase()
			}),
		[props.left, props.right]
	);

	const { allValuesWithDiff, diffWithChangedKeys } = useMemo(() => {
		const leftKeys = new Set(
			props.left
				.filter((item) => item.value.includes('='))
				.map((item) => item.value.split('=')[0])
		);
		const rightKeys = new Set(
			props.right
				.filter((item) => item.value.includes('='))
				.map((item) => item.value.split('=')[0])
		);
		const allKeys = new Set([
			...Array.from(leftKeys),
			...Array.from(rightKeys)
		]);

		const keysPresentInBoth = Array.from(allKeys).filter(
			(key) => leftKeys.has(key) && rightKeys.has(key)
		);

		const keysWithDiff = keysPresentInBoth.filter((key) => {
			const leftValue = props.left.find((item) =>
				item.value.includes(key)
			)?.value;

			const rightValue = props.right.find((item) =>
				item.value.includes(key)
			)?.value;

			return leftValue && rightValue && leftValue !== rightValue;
		});

		const diffWithChangedKeys = keysWithDiff
			.map((key) => {
				return {
					left: props.left.find((item) => item.value.includes(key)),
					right: props.right.find((item) => item.value.includes(key))
				};
			})
			// Should ignore when key is repeated more than once so no clashes occur
			.filter(({ left, right }) => {
				const leftOccurences = props.left.filter(
					(item) => item.value === left?.value
				).length;
				const rightOccurences = props.right.filter(
					(item) => item.value === right?.value
				).length;

				return leftOccurences === 1 && rightOccurences === 1;
			});

		const allValuesWithDiff = diffWithChangedKeys
			.reduce<(string | undefined)[]>(
				(acc, { left, right }) => [...acc, left?.value, right?.value],
				[]
			)
			.filter(Boolean);

		return { allValuesWithDiff, diffWithChangedKeys };
	}, [props.left, props.right]);

	return (
		<div className="flex flex-col gap-2">
			{diffWithChangedKeys.length ? (
				<div className="flex flex-wrap gap-1 px-4 pb-2 border-b border-border-primary">
					{diffWithChangedKeys.map(({ left, right }) => (
						<TagDiff
							key={`${left?.value}_${right?.value}`}
							left={left}
							right={right}
						/>
					))}
				</div>
			) : null}
			<div className="flex flex-wrap items-center gap-1 px-4">
				{diff.map((change, idx) => (
					<MultipleDiff
						key={idx}
						change={change}
						allValuesWithDiff={allValuesWithDiff}
					/>
				))}
			</div>
		</div>
	);
};
