/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ScrollToTopPage } from '@/shared/tailwind-ui';
import {
	RunsFormContainer,
	RunsModePickerContainer,
	SelectionPopoverContainer
} from '@/bublik/features/runs';
import { CopyShortUrlButtonContainer } from '@/bublik/features/copy-url';

function RunsPage() {
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
			<SelectionPopoverContainer />
		</>
	);
}

export { RunsPage };
