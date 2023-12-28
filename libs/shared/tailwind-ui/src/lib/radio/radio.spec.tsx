/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { it, describe, expect } from 'vitest';
import { render } from '@testing-library/react';
import renderer from 'react-test-renderer';

import { Radio, RadioProps } from './radio';

const getRadioProps = (): RadioProps => {
	return { label: 'Test label' };
};

describe('Radio', () => {
	it('should render successfully', () => {
		const { baseElement } = render(<Radio {...getRadioProps()} />);

		expect(baseElement).toBeTruthy();
	});

	it('should match snapshot', () => {
		const tree = renderer.create(<Radio {...getRadioProps()} />).toJSON();

		expect(tree).toMatchSnapshot();
	});

	it('should render checked styles', () => {
		const tree = renderer
			.create(<Radio {...getRadioProps()} checked={true} />)
			.toJSON();

		expect(tree).toMatchSnapshot();
	});
});
