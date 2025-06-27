/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';

import { getHistorySearch } from '@/shared/utils';
import {
	RunDetailsAPIResponse,
	HistoryMode,
	RunDataResults
} from '@/shared/types';
import { Icon } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';
import {
	ContextLinks,
	ContextLinksSection
} from '@/bublik/features/context-links';

export interface LinkToHistoryProps {
	result: RunDataResults;
	runDetails: RunDetailsAPIResponse;
	userPreferredHistoryMode?: HistoryMode;
}

export const LinkToHistory = (props: LinkToHistoryProps) => {
	const { runDetails, result, userPreferredHistoryMode = 'linear' } = props;
	const search = getHistorySearch(runDetails, result, userPreferredHistoryMode);
	const prefilled = { pathname: '/history', search: search.prefilled };

	const sections = useMemo<ContextLinksSection[]>(
		() => [
			{
				label: 'Prefilled',
				items: [
					{
						label: 'By all possible parameters',
						to: { pathname: '/history', search: search.prefilled },
						state: { fromRun: true }
					}
				]
			},
			{
				label: 'Direct',
				items: [
					{
						label: 'By test name',
						to: { pathname: '/history', search: search.byTestName }
					},
					{
						label: 'By iteration',
						to: { pathname: '/history', search: search.byIteration }
					},
					{
						label: 'By iteration and important tags',
						to: {
							pathname: '/history',
							search: search.byIterationWithImportant
						}
					},
					{
						label: 'By iteration and all tags',
						to: { pathname: '/history', search: search.byIterationWithAllTags }
					}
				]
			}
		],
		[
			search.byIteration,
			search.byIterationWithAllTags,
			search.byIterationWithImportant,
			search.byTestName,
			search.prefilled
		]
	);

	return (
		<ContextLinks sections={sections}>
			<LinkWithProject
				className="flex items-center w-full gap-1"
				to={prefilled}
				state={{ fromRun: true }}
			>
				<Icon name="BoxArrowRight" className="grid place-items-center" />
				History
			</LinkWithProject>
		</ContextLinks>
	);
};
