/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { it, describe, expect } from 'vitest';
import { render } from '@testing-library/react';
import renderer from 'react-test-renderer';

import { ErrorMessage } from './error-message';

describe('ErrorMessage', () => {
	it('should render successfully', () => {
		const { getByTestId } = render(<ErrorMessage />);

		const element = getByTestId('input-error-message');

		expect(element).toBeVisible();
	});

	it('should match snapshot', () => {
		const tree = renderer.create(<ErrorMessage />).toJSON();

		expect(tree).toMatchSnapshot();
	});
});
