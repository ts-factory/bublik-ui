/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	AutoReloadContainer,
	ClockContainer,
	LayoutHandlerContainer,
	ModePickerContainer,
	SearchBarContainer,
	TodayButtonContainer,
	TvModeContainer
} from '@/bublik/features/dashboard-v2';
import { CopyShortUrlButtonContainer } from '@/bublik/features/copy-url';
import { useTabTitleWithPrefix } from '@/bublik/features/projects';

// A legacy `?dates=` link never reaches the page: the route's `beforeLoad`
// rewrites it (`rewriteLegacyDates`).
export const DashboardPageV2 = () => {
	useTabTitleWithPrefix('Dashboard - Bublik');

	return (
		<div className="flex flex-col h-full gap-1 p-2">
			<header className="flex flex-col px-6 py-4 bg-bg-primary rounded-t-xl">
				<div className="flex flex-wrap gap-4 justify-between">
					<div className="flex flex-wrap items-stretch justify-center gap-4">
						<SearchBarContainer />
						<TodayButtonContainer />
						<ModePickerContainer />
					</div>
					<div className="flex flex-wrap items-stretch justify-center gap-4">
						<TvModeContainer />
						<AutoReloadContainer />
						<ClockContainer />
						<CopyShortUrlButtonContainer variant="header" />
					</div>
				</div>
			</header>
			<main className="flex-grow isolate">
				<LayoutHandlerContainer />
			</main>
		</div>
	);
};
