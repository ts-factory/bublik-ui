/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { RunDetailsDiffProps } from './run-details-diff';

import { RunDetailsAPIResponse } from '@/shared/types';

export const getDiffProps = ({
	leftData,
	rightData
}: {
	leftData?: RunDetailsAPIResponse;
	rightData?: RunDetailsAPIResponse;
}): RunDetailsDiffProps => {
	if (!leftData || !rightData) {
		return {
			sharedMeta: [],
			projectMeta: []
		};
	}

	const sharedMeta: RunDetailsDiffProps['sharedMeta'] = [
		{
			label: 'Branches',
			left: leftData.branches.map((branch) => ({
				value: branch,
				className: 'bg-badge-16'
			})),
			right: rightData.branches.map((branch) => ({
				value: branch,
				className: 'bg-badge-16'
			}))
		},
		{
			label: 'Revisions',
			left: leftData.revisions.map((revision) => ({
				className: 'bg-badge-2',
				value: `${revision.name}=${revision.value}`,
				url: revision.url
			})),
			right: rightData.revisions.map((revision) => ({
				className: 'bg-badge-2',
				value: `${revision.name}=${revision.value}`,
				url: revision.url
			}))
		},
		{
			label: 'Labels',
			left: leftData.labels.map((label) => ({
				value: label,
				className: 'bg-badge-10'
			})),
			right: rightData.labels.map((label) => ({
				value: label,
				className: 'bg-badge-10'
			}))
		},
		{
			label: 'Important Tags',
			left: leftData.important_tags.map((importantTag) => ({
				value: importantTag,
				className: 'bg-badge-6'
			})),
			right: rightData.important_tags.map((importantTag) => ({
				value: importantTag,
				className: 'bg-badge-6'
			}))
		},
		{
			label: 'Tags',
			left: leftData.relevant_tags.map((tag) => ({
				value: tag,
				className: 'bg-badge-0'
			})),
			right: rightData.relevant_tags.map((tag) => ({
				value: tag,
				className: 'bg-badge-0'
			}))
		}
	];

	const allKeys = Array.from(
		new Set([
			...Object.keys(leftData.special_categories),
			...Object.keys(rightData.special_categories)
		])
	);

	const projectMeta: RunDetailsDiffProps['projectMeta'] = allKeys.map(
		(key) => ({
			label: key,
			left: (leftData.special_categories?.[key] || []).map((value) => ({
				className: `bg-badge-4`,
				value
			})),
			right: (rightData.special_categories?.[key] || []).map((value) => ({
				className: `bg-badge-4`,
				value
			}))
		})
	);

	return { sharedMeta, projectMeta };
};
