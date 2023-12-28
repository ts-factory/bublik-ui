/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { it, describe, expect } from 'vitest';
import { render } from '@testing-library/react';

import { Badge } from './badge';

describe('components/Badge', () => {
	it('should match snapshot', () => {
		const { asFragment } = render(<Badge />);

		expect(asFragment()).toMatchSnapshot();
	});

	it('should display selected variant', () => {
		const { asFragment } = render(<Badge isSelected />);

		expect(asFragment()).toMatchSnapshot();
	});

	it('should display passed background color', () => {
		const { asFragment } = render(<Badge className="bg-badge-16" />);

		expect(asFragment()).toMatchSnapshot();
	});

	it('should display passed background color and override it when selected', () => {
		const { asFragment } = render(<Badge className="bg-badge-16" isSelected />);

		expect(asFragment()).toMatchSnapshot();
	});

	it('should render button if onClick is passed', () => {
		const mock = vi.fn();

		const { getByRole } = render(<Badge onClick={mock}>Badge</Badge>);

		const badge = getByRole('button', { name: /Badge/i });

		expect(badge.tagName).toBe('BUTTON');
	});
});
