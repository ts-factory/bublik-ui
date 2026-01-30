/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { it, describe, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
	BadgesHeaderInput,
	BadgesHeaderInputProps
} from './badge-header-input';
const getDefaultProps = (): BadgesHeaderInputProps => {
	return {
		onChange: (newBadges) => {
			console.log(newBadges);
		},
		value: []
	};
};
describe('BadgesHeaderInput', () => {
	it('should render successfully', () => {
		const { getByTestId } = render(
			<BadgesHeaderInput {...getDefaultProps()} />
		);
		const badge = getByTestId('badge-header-input');
		expect(badge).toBeVisible();
	});
	it('should match snapshot', () => {
		const { asFragment } = render(<BadgesHeaderInput {...getDefaultProps()} />);
		expect(asFragment()).toMatchSnapshot();
	});
});
