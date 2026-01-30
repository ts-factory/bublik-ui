/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { KeyList } from './key-list.component';
describe('KeyList', () => {
	it('should render correctly anchor with url', () => {
		const items = [{ name: 'Item 1', url: 'https://example.com/1' }];
		const { asFragment } = render(<KeyList items={items} />);
		expect(asFragment()).toMatchSnapshot();
	});
	it('should render button when no url', () => {
		const items = [{ name: 'Item 1' }];
		const { asFragment } = render(<KeyList items={items} />);
		expect(asFragment()).toMatchSnapshot();
	});
	it('should render multiple items with url and without', () => {
		const items = [
			{ name: 'Item 1', url: 'https://example.com/1' },
			{ name: 'Item 2' },
			{ name: 'Item 3', url: 'https://example.com/3' }
		];
		const { asFragment } = render(<KeyList items={items} />);
		expect(asFragment()).toMatchSnapshot();
	});
});
