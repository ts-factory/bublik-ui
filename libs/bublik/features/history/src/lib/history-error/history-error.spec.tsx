/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { render } from '@testing-library/react';

import { HistoryError } from './history-error';

describe('HistoryError', () => {
	it('should render without error', () => {
		const { asFragment } = render(<HistoryError />);

		expect(asFragment()).toMatchSnapshot();
	});

	it('should render 404 error', () => {
		const error = {
			status: 404,
			data: { type: 'NotFoundError', message: 'Not Found' }
		};

		const { asFragment } = render(<HistoryError error={error} />);

		expect(asFragment()).toMatchSnapshot();
	});
});
