/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { it, expect, describe } from 'vitest';
import { render } from '@testing-library/react';
import { AppShell } from './app-shell';
describe('components/AppShell', () => {
	it('should render successfully', () => {
		const { getByTestId } = render(<AppShell sidebar={<div>sidebar</div>} />);
		const badge = getByTestId('tw-app-shell');
		expect(badge).toBeVisible();
	});
	it('should match snapshot', () => {
		const { asFragment } = render(<AppShell sidebar={<div>sidebar</div>} />);
		expect(asFragment()).toMatchSnapshot();
	});
});
