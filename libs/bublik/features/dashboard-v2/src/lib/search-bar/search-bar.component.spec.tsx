/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { SearchBar } from './search-bar.component';
describe('<SearchBar />', () => {
	it('should match snapshot', () => {
		const { asFragment } = render(<SearchBar />);
		expect(asFragment()).toMatchSnapshot();
	});
});
