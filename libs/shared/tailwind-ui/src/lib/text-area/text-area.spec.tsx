/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { render } from '@testing-library/react';
import { TextArea } from './text-area';
describe('TextArea', () => {
	it('should render successfully', () => {
		const { asFragment } = render(<TextArea label={'Text area'} />);
		expect(asFragment()).toBeTruthy();
	});
	it('should render default variant', () => {
		const { asFragment } = render(<TextArea label={'Text area'} />);
		expect(asFragment()).toMatchSnapshot();
	});
	it('should render primary variant', () => {
		const { asFragment } = render(
			<TextArea label={'Text area'} variant="primary" />
		);
		expect(asFragment()).toMatchSnapshot();
	});
	it('should render with error', () => {
		const { asFragment } = render(
			<TextArea label={'Text area'} variant="primary" error={'Error message'} />
		);
		expect(asFragment()).toMatchSnapshot();
	});
});
