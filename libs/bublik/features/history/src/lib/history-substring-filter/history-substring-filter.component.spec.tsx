/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { vi } from 'vitest';

import { render } from '@testing-library/react';

import { HistorySubstringFilter } from './history-substring-filter.component';

test('renders correctly', () => {
	it('should render correctly', () => {
		const props = { substringFilter: 'test', onSubstringChange: vi.fn() };

		const { asFragment } = render(<HistorySubstringFilter {...props} />);

		expect(asFragment()).toMatchSnapshot();
	});
});
