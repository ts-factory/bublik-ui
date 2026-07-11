/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SidebarNavGuide } from './sidebar-nav-guide.component';

describe('SidebarNavGuide', () => {
	it('draws the complete guide in one SVG', () => {
		const { container } = render(
			<SidebarNavGuide
				itemCount={3}
				activeIndex={1}
				isActiveItemDisabled={false}
				isGroupActive
				isVisible
			/>
		);

		expect(container.querySelectorAll('svg')).toHaveLength(1);
		expect(
			container
				.querySelector('[data-sidebar-nav-guide-default]')
				?.getAttribute('d')
		).toBe(
			'M 30 -7 V 104 M 30 8 Q 30 18 40 18 H 53 M 30 56 Q 30 66 40 66 H 53 M 30 104 Q 30 114 40 114 H 53'
		);
		expect(
			container
				.querySelector('[data-sidebar-nav-guide-active]')
				?.getAttribute('d')
		).toBe('M 30 -7 V 56 Q 30 66 40 66 H 53');
	});

	it('stops the active path before a disabled item connector', () => {
		const { container } = render(
			<SidebarNavGuide
				itemCount={3}
				activeIndex={1}
				isActiveItemDisabled
				isGroupActive
				isVisible
			/>
		);

		expect(
			container
				.querySelector('[data-sidebar-nav-guide-active]')
				?.getAttribute('d')
		).toBe('M 30 -7 V 36');
	});
});
