/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Dialog, DialogContent } from '@/shared/tailwind-ui';
import { render } from '@testing-library/react';
import { QueryParamProvider } from 'use-query-params';
import { WindowHistoryAdapter } from 'use-query-params/adapters/window';
import { vi } from 'vitest';

import { RunImportResult } from './import-run-form-result-list.component';
import { ImportLogProvider } from '../import-events-table/import-log.component';

describe('ImportRunFormResultList', () => {
	beforeEach(() => {
		// Mock the date to a fixed timestamp in UTC
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

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
