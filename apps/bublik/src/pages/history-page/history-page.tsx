/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ScrollToTopPage } from '@/shared/tailwind-ui';
import {
	HistoryFilterLegendContainer,
	HistoryGlobalSearchFormContainer,
	HistoryLegendCountContainer,
	HistoryPageModePickerContainer,
	HistoryRefreshContainer,
	HistoryResetGlobalFilterContainer,
	HistorySubstringFilterContainer
} from '@/bublik/features/history';
import { CopyShortUrlButtonContainer } from '@/bublik/features/copy-url';

export const HistoryPageV2 = () => {
	return (
		<div className="flex flex-col p-2">
			<header className="flex flex-col gap-4 px-6 py-4 mb-1 bg-white rounded-t-xl">
				<div className="flex flex-wrap justify-between gap-4">
					<HistoryLegendCountContainer />
					<div className="flex flex-wrap justify-start gap-4">
						<HistorySubstringFilterContainer />
						<HistoryGlobalSearchFormContainer />
						<HistoryRefreshContainer />
						<HistoryResetGlobalFilterContainer />
						<CopyShortUrlButtonContainer variant="header" />
					</div>
				</div>
				<HistoryFilterLegendContainer />
			</header>
			<main>
				<HistoryPageModePickerContainer />
			</main>
			<ScrollToTopPage offset={158} />
		</div>
	);
};
