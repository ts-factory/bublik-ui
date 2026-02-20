/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ScrollToTopPage } from '@/shared/tailwind-ui';
import {
	RunsFormContainer,
	RunsModePickerContainer
} from '@/bublik/features/runs';
import { CopyShortUrlButtonContainer } from '@/bublik/features/copy-url';
import { useTabTitleWithPrefix } from '@/bublik/features/projects';
import { useSearchParams } from 'react-router-dom';
import { formatTimeToDot, parseISODuration } from '@/shared/utils';
import { formatDuration } from 'date-fns';

function useRunsPageTitle() {
	const [searchParams] = useSearchParams();

	const startDate = searchParams.get('startDate') ?? '';
	const endDate = searchParams.get('finishDate') ?? '';
	const searchDuration = searchParams.get('duration') ?? '';
	const calendarMode = searchParams.get('calendarMode') ?? '';

	let title = 'Runs - Bublik';

	if (startDate || endDate || searchDuration) {
		if (calendarMode === 'default') {
			const start = formatTimeToDot(startDate);
			const end = formatTimeToDot(endDate);
			title = `${start} - ${end} | Runs - Bublik`;
		} else if (calendarMode === 'duration') {
			const duration = parseISODuration(searchDuration);
			title = `${formatDuration(duration)} | Runs - Bublik`;
		}
	}

	useTabTitleWithPrefix(title);
}

function RunsPage() {
	useRunsPageTitle();

	return (
		<>
			<div className="flex flex-col gap-1 p-2">
				<header className="flex items-center justify-between gap-4 px-6 py-4 bg-white rounded-t-xl">
					<RunsFormContainer />
					<CopyShortUrlButtonContainer variant="header" />
				</header>
				<RunsModePickerContainer />
				<ScrollToTopPage />
			</div>
		</>
	);
}

export { RunsPage };
