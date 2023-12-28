/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { render } from '@testing-library/react';

import { Icon } from '@/shared/tailwind-ui';

import { HistoryWarning } from '../history-warning';

describe('HistoryWarning component', () => {
	it('should render correctly', () => {
		const { asFragment } = render(
			<HistoryWarning
				icon={<Icon name="Filter" />}
				label="label"
				description="description"
			/>
		);

		expect(asFragment()).toMatchSnapshot();
	});
});
