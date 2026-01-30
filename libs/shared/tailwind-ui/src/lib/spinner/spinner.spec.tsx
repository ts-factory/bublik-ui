/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { it, describe, expect } from 'vitest';
import { render } from '@testing-library/react';
import renderer from 'react-test-renderer';
import { Spinner } from './spinner';
describe('Spinner', () => {
	it('should render successfully', () => {
		const { baseElement } = render(<Spinner />);
		expect(baseElement).toBeTruthy();
	});
	it('should match snapshot', () => {
		const tree = renderer.create(<Spinner />).toJSON();
		expect(tree).toMatchSnapshot();
	});
});
