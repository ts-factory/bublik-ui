/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { PerformanceList } from './performance-list.component';

describe('<PerformanceList />', () => {
	it('should match snapshot', () => {
		const { asFragment } = render(
			<PerformanceList
				urls={[{ url: 'https://google.com', timeout: 1, label: 'Google' }]}
			/>
		);

		expect(asFragment()).toMatchSnapshot();
	});
});
