/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Dialog, DialogContent } from '@/shared/tailwind-ui';
import { render } from '@testing-library/react';

import { RunImportResult } from './import-run-form-result-list.component';
import { ImportLogProvider } from '../import-events-table/import-log.component';
import { QueryParamProvider } from 'use-query-params';
import { WindowHistoryAdapter } from 'use-query-params/adapters/window';

describe('ImportRunFormResultList', () => {
	it('should render successfully', () => {
		const { asFragment } = render(
			<QueryParamProvider adapter={WindowHistoryAdapter}>
				<ImportLogProvider>
					<Dialog open>
						<DialogContent>
							<RunImportResult
								results={[
									{
										url: 'https://www.youtube.com/watch?v=1',
										taskId: '1'
									},
									{
										url: 'https://www.youtube.com/watch?v=2',
										taskId: '2'
									},
									{
										url: 'https://www.youtube.com/watch?v=3',
										taskId: '3'
									}
								]}
							/>
						</DialogContent>
					</Dialog>
				</ImportLogProvider>
			</QueryParamProvider>
		);

		expect(asFragment()).toMatchSnapshot();
	});
});
