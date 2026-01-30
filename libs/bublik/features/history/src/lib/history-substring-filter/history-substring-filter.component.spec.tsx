/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { vi, it } from 'vitest';
import { render } from '@testing-library/react';
import { HistorySubstringFilter } from './history-substring-filter.component';
describe('HistorySubstringFilter', () => {
	it('should render correctly', () => {
		const props = { substringFilter: 'test', onSubstringChange: vi.fn() };
		const { asFragment } = render(<HistorySubstringFilter {...props} />);
		expect(asFragment()).toMatchSnapshot();
	});
});
