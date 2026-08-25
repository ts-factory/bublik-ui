/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useSearchParams } from 'react-router-dom';

import { ScrollToTopPage } from '@/shared/tailwind-ui';
import {
	HistoryFilterLegendContainer,
	HistoryGlobalSearchFormContainer,
	HistoryLegendCountContainer,
	HistoryPageModePickerContainer,
	HistoryRefreshContainer,
	HistoryResetGlobalFilterContainer,
	HistorySubstringFilterContainer,
	CombinedChartsProvider,
	resolveHistoryMode
} from '@/bublik/features/history';
import { CopyShortUrlButtonContainer } from '@/bublik/features/copy-url';

export const HistoryPageV2 = () => {
	const [searchParams] = useSearchParams();

	return (
		<div
			className="flex flex-col p-2"
			data-testid="history-page"
			data-history-mode={resolveHistoryMode(searchParams.get('mode'))}
		>
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
				<CombinedChartsProvider>
					<HistoryPageModePickerContainer />
				</CombinedChartsProvider>
			</main>
			<ScrollToTopPage offset={158} />
		</div>
	);
};
