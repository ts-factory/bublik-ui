/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { it, describe, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Badge, BadgeVariants } from './badge';
describe('components/Badge', () => {
	it('should match snapshot', () => {
		const { asFragment } = render(<Badge />);
		expect(asFragment()).toMatchSnapshot();
	});
	it('should display selected variant', () => {
		const { asFragment } = render(<Badge isSelected />);
		expect(asFragment()).toMatchSnapshot();
	});
	it('should display passed background color', () => {
		const { asFragment } = render(<Badge className="bg-badge-16" />);
		expect(asFragment()).toMatchSnapshot();
	});
	it('should display passed background color and override it when selected', () => {
		const { asFragment } = render(<Badge className="bg-badge-16" isSelected />);
		expect(asFragment()).toMatchSnapshot();
	});
	it('should render button if onClick is passed', () => {
		const mock = vi.fn();
		const { getByRole } = render(<Badge onClick={mock}>Badge</Badge>);
		const badge = getByRole('button', { name: /Badge/i });
		expect(badge.tagName).toBe('BUTTON');
	});

	describe('interactive states', () => {
		it('should not hint at a hover on a badge that does nothing', () => {
			const { getByTestId } = render(<Badge>Badge</Badge>);
			const badge = getByTestId('tw-badge');

			// The regression this guards: hover leaking onto every static badge
			// would make labels all over the app look like filter controls.
			expect(badge.className).not.toMatch(/hover:border-/);
			expect(badge.className).not.toMatch(/cursor-pointer/);
		});

		it('should preview the hover in the chip own hue, not a house blue', () => {
			const { getByTestId } = render(
				<Badge variant={BadgeVariants.Expected} onClick={vi.fn()}>
					PASSED
				</Badge>
			);
			const badge = getByTestId('tw-badge');

			expect(badge.className).toContain('cursor-pointer');
			expect(badge.className).toContain('hover:border-text-expected/40');
		});

		it('should drop the hover preview once the chip is selected', () => {
			const { getByTestId } = render(
				<Badge variant={BadgeVariants.Expected} isSelected onClick={vi.fn()}>
					PASSED
				</Badge>
			);
			const badge = getByTestId('tw-badge');

			// `hover:border-X` and `border-X` are different twMerge groups, so both
			// would survive and the chip would flicker between the faint preview
			// and the real outline every time the pointer crossed it.
			expect(badge.className).toContain('border-text-expected');
			expect(badge.className).not.toMatch(/hover:border-/);
		});

		it('should take isInteractive when the click comes from elsewhere', () => {
			const { getByTestId } = render(
				<Badge as="a" href="#somewhere" isInteractive>
					Badge
				</Badge>
			);

			expect(getByTestId('tw-badge').className).toContain('cursor-pointer');
		});

		it.each([
			[BadgeVariants.Unexpected, 'border-text-unexpected'],
			[BadgeVariants.Triage, 'border-text-triage'],
			[BadgeVariants.Warning, 'border-bg-warning'],
			[BadgeVariants.Caution, 'border-bg-busy'],
			[BadgeVariants.Info, 'border-primary'],
			[BadgeVariants.Env, 'border-accent-env'],
			[BadgeVariants.Neutral, 'border-text-menu'],
			[BadgeVariants.Outline, 'border-text-primary']
		])(
			'should outline %s in its own colour when selected',
			(variant, expected) => {
				const { getByTestId } = render(
					<Badge variant={variant} isSelected onClick={vi.fn()}>
						Badge
					</Badge>
				);

				expect(getByTestId('tw-badge').className).toContain(expected);
			}
		);
	});
});
