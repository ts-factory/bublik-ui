/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { it, describe, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import renderer from 'react-test-renderer';
import { InputLabel } from './input-label';
describe('InputLabel', () => {
	it('should render successfully', () => {
		const { getByTestId } = render(<InputLabel />);
		const element = getByTestId('input-label');
		expect(element).toBeVisible();
	});
	it('should match snapshot', () => {
		const tree = renderer.create(<InputLabel />).toJSON();
		expect(tree).toMatchSnapshot();
	});
});
