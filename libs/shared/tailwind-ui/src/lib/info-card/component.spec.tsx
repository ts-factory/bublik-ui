/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { it, describe, expect } from 'vitest';
import { render } from '@testing-library/react';
import renderer from 'react-test-renderer';
import { InfoCard } from './component';
describe('InfoCard', () => {
	it('should render successfully', () => {
		const { baseElement } = render(
			<InfoCard header="Info card" message="Info card message" />
		);
		expect(baseElement).toBeTruthy();
	});
	it('should match snapshot', () => {
		const tree = renderer
			.create(<InfoCard header="Info card" message="Info card message" />)
			.toJSON();
		expect(tree).toMatchSnapshot();
	});
});
