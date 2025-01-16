/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useDocumentTitle } from '@/shared/hooks';
import {
	ImportEventsTableContainer,
	ImportLogProvider,
	ImportRunFormContainer
} from '@/bublik/features/run-import';

export const ImportPage = () => {
	useDocumentTitle('Import - Bublik');

	return (
		<div className="p-2 overflow-hidden h-full">
			<div className="flex flex-col gap-1 h-full">
				<ImportLogProvider>
					<ImportEventsTableContainer>
						<ImportRunFormContainer />
					</ImportEventsTableContainer>
				</ImportLogProvider>
			</div>
		</div>
	);
};
