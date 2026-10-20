/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
	forwardRef,
	type ComponentPropsWithoutRef,
	type ComponentType,
	type CSSProperties,
	type ReactNode
} from 'react';
import { MemoryRouter, type To } from 'react-router-dom';
import { beforeAll, describe, expect, it, vi } from 'vitest';

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

const MODE_ITEMS = [
	{ value: 'tree', icon: 'LayoutLogSidebar', label: 'Tree + log' },
	{ value: 'log', icon: 'LayoutLogSingle', label: 'Log' }
] as const;

function renderSubmenuItem({
	disabled = false,
	isSidebarOpen = true,
	withModeSwitch = false
}: {
	disabled?: boolean;
	isSidebarOpen?: boolean;
	withModeSwitch?: boolean;
} = {}) {
	const handleLinkClick = vi.fn();
	const handleSelect = vi.fn();

	// Like `LinkWithProject`, it passes on whatever else it is given: a hover
	// card's trigger hands the link its pointer handlers.
	type TestLinkProps = Omit<ComponentPropsWithoutRef<'a'>, 'href'> & {
		to: To;
		className?: string;
		style?: CSSProperties;
		children: ReactNode;
	};

	const TestLink = forwardRef<HTMLAnchorElement, TestLinkProps>(
		function TestLink({ to, children, ...props }, ref) {
			return (
				<a
					{...props}
					ref={ref}
					href={String(to)}
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

	const tree = (isOpen: boolean) => (
		<MemoryRouter>
			<TooltipProvider>
				<SidebarProvider isSidebarOpen={isOpen}>
					<SidebarNavSubmenuItemContainer
						to="/runs"
						disabled={disabled}
						linkComponent={TestLink}
					>
						<SidebarNavSubmenuItemContainer.Icon name="Paper" />
						<SidebarNavSubmenuItemContainer.Label>
							Details
						</SidebarNavSubmenuItemContainer.Label>
						{withModeSwitch ? (
							<SidebarNavSubmenuItemContainer.ModeSwitch
								aria-label="Details layout"
								items={MODE_ITEMS}
								value="log"
								onSelect={handleSelect}
								testId="details-mode-switch"
							/>
						) : (
							<SidebarNavSubmenuItemContainer.InfoButton>
								<div>
									<span>Details help content</span>
									<DialogClose>Close help</DialogClose>
								</div>
							</SidebarNavSubmenuItemContainer.InfoButton>
						)}
					</SidebarNavSubmenuItemContainer>
				</SidebarProvider>
			</TooltipProvider>
		</MemoryRouter>
	);

	const result = render(tree(isSidebarOpen));
	const setSidebarOpen = (isOpen: boolean) => result.rerender(tree(isOpen));

	return { ...result, handleLinkClick, handleSelect, setSidebarOpen };
}

describe('SidebarNavSubmenuItemContainer', () => {
	beforeAll(() => {
		// The mode card's arrow measures itself with a ResizeObserver jsdom does
		// not have.
		vi.stubGlobal(
			'ResizeObserver',
			class ResizeObserver {
				observe = () => undefined;
				unobserve = () => undefined;
				disconnect = () => undefined;
			}
		);
	});

	it('shows an active enabled hierarchy guide', () => {
		const { container } = renderSubmenuItem();
		const guide = container.querySelector('[data-sidebar-nav-submenu-guide]');

		expect(guide).toBeInstanceOf(HTMLLIElement);
		expect(guide?.getAttribute('data-sidebar-nav-submenu-guide-active')).toBe(
			'true'
		);
		expect(guide?.hasAttribute('data-sidebar-nav-submenu-guide-disabled')).toBe(
			false
		);
	});

	it('uses the default hierarchy guide for disabled items', () => {
		const { container } = renderSubmenuItem({ disabled: true });
		const guide = container.querySelector('[data-sidebar-nav-submenu-guide]');

		expect(guide).toBeInstanceOf(HTMLLIElement);
		expect(guide?.getAttribute('data-sidebar-nav-submenu-guide-disabled')).toBe(
			'true'
		);
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
	it('switches the mode from its icons without following the link', async () => {
		const user = userEvent.setup();
		const { handleLinkClick, handleSelect } = renderSubmenuItem({
			withModeSwitch: true
		});

		const group = screen.getByRole('group', { name: 'Details layout' });
		const tree = screen.getByRole('button', { name: 'Tree + log' });
		const log = screen.getByRole('button', { name: 'Log' });

		expect(group.getAttribute('data-testid')).toBe('details-mode-switch');
		expect(log.getAttribute('aria-pressed')).toBe('true');
		expect(tree.getAttribute('aria-pressed')).toBe('false');

		await user.click(tree);

		expect(handleSelect).toHaveBeenCalledWith('tree');
		expect(handleLinkClick).not.toHaveBeenCalled();
	});

	it('hides the mode icons while the sidebar is collapsed', () => {
		renderSubmenuItem({ withModeSwitch: true, isSidebarOpen: false });

		expect(screen.queryByRole('group', { name: 'Details layout' })).toBeNull();
	});

	it('marks a collapsed row with a dot per mode, the current one solid', () => {
		const { container } = renderSubmenuItem({
			withModeSwitch: true,
			isSidebarOpen: false
		});

		const pips = container.querySelectorAll('[data-mode-pip]');

		expect(
			Array.from(pips, (pip) => pip.getAttribute('data-mode-pip'))
		).toEqual(['tree', 'log']);
		expect(
			container
				.querySelector('[data-mode-pip][data-selected="true"]')
				?.getAttribute('data-mode-pip')
		).toBe('log');
	});

	it('drops the mode dots while the sidebar is open', () => {
		const { container } = renderSubmenuItem({ withModeSwitch: true });

		expect(container.querySelector('[data-mode-pips]')).toBeNull();
	});

	it('draws no mode dots on a disabled collapsed item', () => {
		const { container } = renderSubmenuItem({
			withModeSwitch: true,
			isSidebarOpen: false,
			disabled: true
		});

		expect(container.querySelector('[data-mode-pips]')).toBeNull();
	});

	it('offers the modes in a hover card while the sidebar is collapsed', async () => {
		const user = userEvent.setup();
		const { handleLinkClick, handleSelect } = renderSubmenuItem({
			withModeSwitch: true,
			isSidebarOpen: false
		});

		await user.hover(screen.getByRole('link'));

		const panel = await screen.findByRole('group', { name: 'Details layout' });
		const tree = screen.getByRole('button', { name: 'Tree + log' });
		const log = screen.getByRole('button', { name: 'Log' });

		expect(panel.getAttribute('data-testid')).toBe('details-mode-switch-panel');
		expect(log.getAttribute('aria-pressed')).toBe('true');
		expect(tree.getAttribute('aria-pressed')).toBe('false');

		await user.click(tree);

		expect(handleSelect).toHaveBeenCalledWith('tree');
		expect(handleLinkClick).not.toHaveBeenCalled();
	});

	it('keeps the mode card up when the row itself is clicked', async () => {
		const user = userEvent.setup();
		const { handleLinkClick } = renderSubmenuItem({
			withModeSwitch: true,
			isSidebarOpen: false
		});

		await user.hover(screen.getByRole('link'));
		await screen.findByRole('group', { name: 'Details layout' });

		await user.click(screen.getByRole('link'));

		expect(handleLinkClick).toHaveBeenCalledTimes(1);
		expect(
			screen
				.getByRole('group', { name: 'Details layout' })
				.closest('[data-state]')
				?.getAttribute('data-state')
		).toBe('open');
	});

	it('offers no mode card on a disabled collapsed item', async () => {
		const user = userEvent.setup();
		renderSubmenuItem({
			withModeSwitch: true,
			isSidebarOpen: false,
			disabled: true
		});

		await user.hover(screen.getByText('Details'));

		// Past the card's open delay.
		await new Promise((resolve) => setTimeout(resolve, 400));
		expect(screen.queryByRole('group', { name: 'Details layout' })).toBeNull();
	});

	it('keeps the row mounted when the sidebar toggles', () => {
		const { setSidebarOpen } = renderSubmenuItem({ withModeSwitch: true });
		const row = screen.getByRole('link');

		// A remounted row has no padding to transition from, so it jumps.
		setSidebarOpen(false);
		expect(screen.getByRole('link')).toBe(row);

		setSidebarOpen(true);
		expect(screen.getByRole('link')).toBe(row);
	});

	it('hides the mode icons on a disabled item', () => {
		renderSubmenuItem({ withModeSwitch: true, disabled: true });

		expect(screen.queryByRole('group', { name: 'Details layout' })).toBeNull();
	});
});
