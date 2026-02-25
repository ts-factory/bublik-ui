/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { it, expect, describe } from 'vitest';
import { render } from '@testing-library/react';
import { AppShell, withSidebar } from './app-shell';

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

	it('should hide sidebar container when using withSidebar(true)', () => {
		const Story = () => <div data-testid="content" />;
		const decoratedStory = withSidebar(true)(Story);
		const { container, getByTestId } = render(decoratedStory);

		expect(container.querySelector('#sidebar')).not.toBeInTheDocument();
		expect(getByTestId('content')).toBeInTheDocument();
	});
});
