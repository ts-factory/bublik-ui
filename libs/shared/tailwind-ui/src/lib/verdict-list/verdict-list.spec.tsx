/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { it, describe, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RESULT_TYPE } from '@/shared/types';
import { VerdictList, VerdictListProps } from './verdict-list';
const getDefaultProps = (): VerdictListProps => {
	return {
		verdicts: ['verdict-1', 'verdict-2', 'verdict-3'],
		variant: 'obtained',
		result: RESULT_TYPE.Passed
	};
};
describe('VerdictList', () => {
	it('should render successfully', () => {
		const { baseElement } = render(<VerdictList {...getDefaultProps()} />);
		expect(baseElement).toBeTruthy();
	});
	it('should match snapshot', () => {
		const { asFragment } = render(<VerdictList {...getDefaultProps()} />);
		expect(asFragment()).toMatchSnapshot();
	});
	it('should highlight selected verdicts', () => {
		const { asFragment } = render(
			<VerdictList
				{...getDefaultProps()}
				isNotExpected={true}
				selectedVerdicts={['verdict-1']}
				variant="expected"
			/>
		);
		expect(asFragment()).toMatchSnapshot();
	});
	it('should render expected result (TRANSPARENT)', () => {
		const { asFragment } = render(
			<VerdictList
				{...getDefaultProps()}
				isNotExpected={true}
				variant="expected"
			/>
		);
		expect(asFragment()).toMatchSnapshot();
	});
	it('should render not expected result (RED)', () => {
		const { asFragment } = render(
			<VerdictList
				{...getDefaultProps()}
				isNotExpected={true}
				variant="obtained"
			/>
		);
		expect(asFragment()).toMatchSnapshot();
	});
	it('should render not expected result (GREEN)', () => {
		const { asFragment } = render(
			<VerdictList
				{...getDefaultProps()}
				isNotExpected={false}
				variant="obtained"
			/>
		);
		expect(asFragment()).toMatchSnapshot();
	});
});
