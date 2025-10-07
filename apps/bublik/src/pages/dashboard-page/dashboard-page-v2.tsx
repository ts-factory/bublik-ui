/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Navigate, useSearchParams } from 'react-router-dom';

import {
	AutoReloadContainer,
	ClockContainer,
	DASHBOARD_TABLE_ID,
	LayoutHandlerContainer,
	ModePickerContainer,
	SearchBarContainer,
	TodayButtonContainer,
	TvModeContainer
} from '@/bublik/features/dashboard-v2';
import { formatTimeToAPI, parseTimeApi } from '@/shared/utils';
import { CopyShortUrlButtonContainer } from '@/bublik/features/copy-url';
import { useTabTitleWithPrefix } from '@/bublik/features/projects';

export const DashboardPageV2 = () => {
	useTabTitleWithPrefix('Dashboard - Bublik');
	const [searchParams] = useSearchParams();

	const search = Object.fromEntries(searchParams.entries());

	if (search?.['dates']) {
		try {
			const baseStr = window.atob(search.dates);

			const dates = JSON.parse(baseStr) as Record<string, string>;

			const newSearchParams = new URLSearchParams();

			if (search?.['mode']) newSearchParams.set('mode', search?.['mode']);

			const d = Object.values(dates)
				.map(parseTimeApi)
				.map((d) => d.getTime())
				.sort((a, b) => a - b)
				.map((d) => new Date(d));

			const secondary = d?.[0];
			const main = d?.[1];

			if (main && secondary) {
				newSearchParams.set(
					DASHBOARD_TABLE_ID.Secondary,
					formatTimeToAPI(secondary)
				);

				newSearchParams.set(DASHBOARD_TABLE_ID.Main, formatTimeToAPI(main));
			} else if (main || secondary) {
				if (main) {
					newSearchParams.set(DASHBOARD_TABLE_ID.Main, formatTimeToAPI(main));
				}

				if (secondary) {
					newSearchParams.set(
						DASHBOARD_TABLE_ID.Main,
						formatTimeToAPI(secondary)
					);
				}
			}

			return (
				<Navigate
					to={{ pathname: '/dashboard', search: newSearchParams.toString() }}
					replace
				/>
			);
		} catch (e: unknown) {
			console.warn('Failed parsing search', e);
		}
	}

	return (
		<div className="flex flex-col h-full gap-1 p-2">
			<header className="flex flex-col px-6 py-4 bg-white rounded-t-xl">
				<div className="flex flex-wrap justify-between">
					<div className="flex flex-wrap items-stretch justify-center gap-6">
						<SearchBarContainer />
						<TodayButtonContainer />
						<ModePickerContainer />
					</div>
					<div className="flex flex-wrap items-stretch justify-center gap-6">
						<TvModeContainer />
						<AutoReloadContainer />
						<ClockContainer />
						<CopyShortUrlButtonContainer variant="header" />
					</div>
				</div>
			</header>
			<main className="flex-grow">
				<LayoutHandlerContainer />
			</main>
		</div>
	);
};
