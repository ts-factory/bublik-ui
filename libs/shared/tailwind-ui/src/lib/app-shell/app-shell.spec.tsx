/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { it, expect, describe } from 'vitest';
import { render } from '@testing-library/react';
import { AppShell, withSidebar } from './app-shell';

/** The page gets what the sidebar leaves of `--page-max-width` */
const CAPPED_PAGE_MAX_WIDTH =
	'max-w-[calc(var(--page-max-width)_-_var(--shell-sidebar-width))]';

describe('components/AppShell', () => {
	it('should render successfully', () => {
		const { getByTestId } = render(<AppShell sidebar={<div>sidebar</div>} />);
		const badge = getByTestId('tw-app-shell');
		expect(badge).toBeVisible();
	});
	it('should match snapshot', () => {
		const { asFragment } = render(<AppShell sidebar={<div>sidebar</div>} />);
		expect(asFragment()).toMatchSnapshot();
	});

	it('should render without sidebar when hidden mode enabled', () => {
		const { queryByText, queryByTestId } = render(
			<AppShell sidebar={<div>sidebar</div>} hideSidebar>
				<div data-testid="content" />
			</AppShell>
		);

		expect(queryByText('sidebar')).not.toBeInTheDocument();
		expect(queryByTestId('content')).toBeInTheDocument();
	});

	it('should leave the page uncapped in the full layout', () => {
		const { container, getByTestId } = render(
			<AppShell sidebar={<div>sidebar</div>} />
		);

		expect(container.querySelector('#page-content')).not.toHaveClass(
			CAPPED_PAGE_MAX_WIDTH
		);
		expect(getByTestId('tw-app-shell').style.paddingLeft).toBe('');
	});

	it('should cap and center the page beside the sidebar in the sidebar-left layout', () => {
		const { container, getByTestId } = render(
			<AppShell sidebar={<div>sidebar</div>} layout="sidebar-left" />
		);

		expect(container.querySelector('#page-content')).toHaveClass(
			'mx-auto',
			CAPPED_PAGE_MAX_WIDTH
		);
		expect(getByTestId('tw-app-shell').style.paddingLeft).toBe('');
	});

	it('should center the sidebar and the capped page together in the centered layout', () => {
		const { container, getByTestId } = render(
			<AppShell sidebar={<div>sidebar</div>} layout="centered" />
		);

		expect(container.querySelector('#page-content')).toHaveClass(
			'mr-auto',
			CAPPED_PAGE_MAX_WIDTH
		);
		expect(
			getByTestId('tw-app-shell').style.getPropertyValue(
				'--shell-sidebar-width'
			)
		).toBe('var(--sidebar-width-closed)');
	});

	it('should take the open sidebar off the capped page width', () => {
		localStorage.setItem('sidebar-open', 'true');
		const { getByTestId } = render(
			<AppShell sidebar={<div>sidebar</div>} layout="centered" />
		);

		expect(
			getByTestId('tw-app-shell').style.getPropertyValue(
				'--shell-sidebar-width'
			)
		).toBe('var(--sidebar-width-open)');
		localStorage.clear();
	});

	it('should hide sidebar container when using withSidebar(true)', () => {
		const Story = () => <div data-testid="content" />;
		const decoratedStory = withSidebar(true)(Story);
		const { container, getByTestId } = render(decoratedStory);

		expect(container.querySelector('#sidebar')).not.toBeInTheDocument();
		expect(getByTestId('content')).toBeInTheDocument();
	});
});
