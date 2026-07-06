/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
	forwardRef,
	type ComponentType,
	type CSSProperties,
	type ReactNode
} from 'react';
import { MemoryRouter, type To } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import {
	DialogClose,
	SidebarProvider,
	TooltipProvider
} from '@/shared/tailwind-ui';

import { SidebarNavSubmenuItemContainer } from './sidebar-nav-submenu-item.component';

vi.mock('@/shared/tailwind-ui', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@/shared/tailwind-ui')>();

	return {
		...actual,
		Icon: () => <svg data-testid="sidebar-nav-test-icon" />
	};
});

function renderSubmenuItem({ disabled = false }: { disabled?: boolean } = {}) {
	const handleLinkClick = vi.fn();

	type TestLinkProps = {
		to: To;
		className?: string;
		style?: CSSProperties;
		children: ReactNode;
	};

	const TestLink = forwardRef<HTMLAnchorElement, TestLinkProps>(
		function TestLink({ to, className, style, children }, ref) {
			return (
				<a
					ref={ref}
					href={String(to)}
					className={className}
					style={style}
					onClick={(event) => {
						event.preventDefault();
						handleLinkClick();
					}}
				>
					{children}
				</a>
			);
		}
	) as ComponentType<TestLinkProps>;

	const result = render(
		<MemoryRouter>
			<TooltipProvider>
				<SidebarProvider isSidebarOpen>
					<SidebarNavSubmenuItemContainer
						to="/runs"
						disabled={disabled}
						linkComponent={TestLink}
					>
						<SidebarNavSubmenuItemContainer.Label>
							Details
						</SidebarNavSubmenuItemContainer.Label>
						<SidebarNavSubmenuItemContainer.InfoButton>
							<div>
								<span>Details help content</span>
								<DialogClose>Close help</DialogClose>
							</div>
						</SidebarNavSubmenuItemContainer.InfoButton>
					</SidebarNavSubmenuItemContainer>
				</SidebarProvider>
			</TooltipProvider>
		</MemoryRouter>
	);

	return { ...result, handleLinkClick };
}

describe('SidebarNavSubmenuItemContainer', () => {
	it('shows an active enabled hierarchy guide', () => {
		const { container } = renderSubmenuItem();
		const guide = container.querySelector('[data-sidebar-nav-submenu-guide]');
		const branch = container.querySelector('[data-sidebar-nav-guide-branch]');

		expect(guide).toBeInstanceOf(HTMLLIElement);
		expect(branch?.className).toContain('border-primary');
	});

	it('uses the default hierarchy guide for disabled items', () => {
		const { container } = renderSubmenuItem({ disabled: true });
		const guide = container.querySelector('[data-sidebar-nav-submenu-guide]');
		const branch = container.querySelector('[data-sidebar-nav-guide-branch]');

		expect(guide).toBeInstanceOf(HTMLLIElement);
		expect(branch?.className).toContain('border-border-primary');
	});

	it('keeps info button clicks from triggering link navigation', async () => {
		const user = userEvent.setup();
		const { container, handleLinkClick } = renderSubmenuItem();

		await user.click(screen.getByText('Details'));
		expect(handleLinkClick).toHaveBeenCalledTimes(1);

		const infoButton = container.querySelector('[data-info-button]');
		expect(infoButton).toBeInstanceOf(HTMLButtonElement);

		await user.click(infoButton as HTMLButtonElement);

		expect(await screen.findByText('Details help content')).toBeTruthy();
		expect(handleLinkClick).toHaveBeenCalledTimes(1);

		await user.click(screen.getByText('Close help'));
		expect(handleLinkClick).toHaveBeenCalledTimes(1);
	});
});
