/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Dialog, DialogContent } from '@/shared/tailwind-ui';
import { render } from '@testing-library/react';

import { RunImportResult } from './import-run-form-result-list.component';

describe('ImportRunFormResultList', () => {
	it('should render successfully', () => {
		const { asFragment } = render(
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
		);

		expect(asFragment()).toMatchSnapshot();
	});
});
