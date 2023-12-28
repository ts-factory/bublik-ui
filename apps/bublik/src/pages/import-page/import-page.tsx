/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useDocumentTitle } from '@/shared/hooks';
import {
	ImportEventsTableContainer,
	ImportRunFormContainer
} from '@/bublik/features/run-import';

export const ImportPage = () => {
	useDocumentTitle('Import - Bublik');

	return (
		<div className="p-2">
			<div className="flex flex-col h-full gap-1">
				<ImportEventsTableContainer>
					<ImportRunFormContainer />
				</ImportEventsTableContainer>
			</div>
		</div>
	);
};
