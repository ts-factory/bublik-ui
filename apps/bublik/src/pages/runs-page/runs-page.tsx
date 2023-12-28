/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useDocumentTitle } from '@/shared/hooks';
import { ScrollToTopPage } from '@/shared/tailwind-ui';
import {
	RunsFormContainer,
	RunsModePickerContainer,
	SelectionPopoverContainer
} from '@/bublik/features/runs';

export const RunsPage = () => {
	useDocumentTitle('Runs - Bublik');

	return (
		<>
			<div className="flex flex-col gap-1 p-2">
				<header className="flex items-center justify-start gap-4 px-6 py-4 bg-white rounded-t-xl">
					<RunsFormContainer />
				</header>
				<RunsModePickerContainer />
				<ScrollToTopPage />
			</div>
			<SelectionPopoverContainer />
		</>
	);
};
