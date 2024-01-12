/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Dialog, DialogContent } from '@/shared/tailwind-ui';
import { render } from '@testing-library/react';

import { RunImportResult } from './import-run-form-result-list.component';

describe('ImportRunFormResultList', () => {
	it('should render successfully', () => {
		const { asFragment } = render(
			<Provider store={configureStore({ reducer: {} })}>
				<Dialog open>
					<DialogContent>
						<RunImportResult
							results={[
								{ url: 'https://www.youtube.com/watch?v=1', taskId: '1' },
								{ url: 'https://www.youtube.com/watch?v=2', taskId: '2' },
								{ url: 'https://www.youtube.com/watch?v=3', taskId: '3' }
							]}
						/>
					</DialogContent>
				</Dialog>
			</Provider>
		);

		expect(asFragment()).toMatchSnapshot();
	});
});
