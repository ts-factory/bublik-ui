/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { TooltipProvider } from '@/shared/tailwind-ui';
import type { IssueRule } from '@/shared/types';

vi.mock('@/services/bublik-api', () => {
	const idle = () => ({ data: undefined, isFetching: false });
	const mutation = () => [vi.fn()];

	return {
		bublikAPI: { useGetAllProjectsQuery: () => ({ data: [] }) },
		useGetIssuePickerQuery: idle,
		useGetIssueQuery: idle,
		useGetIssueSearchOptionsQuery: idle,
		useGetTestPickerQuery: idle,
		useGetTestSearchOptionsQuery: idle,
		useCreateRuleMutation: mutation,
		useUpdateRuleMutation: mutation,
		useActivateRulesMutation: mutation,
		useDeactivateRulesMutation: mutation,
		useDeleteRuleMutation: mutation
	};
});

// The SVG icons do not load under vitest; a stub per name keeps `Icon` rendering.
vi.mock('@/icons', async (importOriginal) => {
	const Stub = (props: Record<string, unknown>) => <svg {...props} />;
	const icons = await importOriginal<Record<string, unknown>>();

	return Object.fromEntries(Object.keys(icons).map((name) => [name, Stub]));
});

vi.mock('@/bublik/features/auth', () => ({
	LoginRequired: ({ children }: { children: ReactNode }) => children
}));

vi.mock('@/bublik/features/projects', () => ({
	LinkWithProject: () => null,
	useProjectSearch: () => ({ projectIds: [] })
}));

vi.mock('../classify/classify-button.container', () => ({
	ClassifyButton: () => null
}));

const { DuplicateRuleButton, EditRuleButton } = await import(
	'./rule-drawer.container'
);

function rule(overrides: Partial<IssueRule> = {}): IssueRule {
	return {
		id: 12,
		project: 3,
		issue: 7,
		issue_title: 'ethtool reset regression',
		issue_state: 'open',
		project_name: 'ethtool',
		bug_key: null,
		bug_url: null,
		category: 'known-issue',
		expected: true,
		active: true,
		test: 42,
		test_name: 'reset',
		test_path: 'ethtool/reset',
		parameters: {},
		verdicts: null,
		tags: [],
		...overrides
	};
}

function Harness({ rule }: { rule: IssueRule }) {
	return (
		<TooltipProvider>
			<EditRuleButton rule={rule} />
			<DuplicateRuleButton rule={rule} />
		</TooltipProvider>
	);
}

function drawerField(testId: string) {
	return within(
		within(screen.getByTestId('rule-drawer')).getByTestId(testId)
	).getByRole('combobox');
}

function openEdit() {
	fireEvent.click(screen.getByTestId('rule-edit'));
}

function openDuplicate() {
	fireEvent.click(screen.getByTestId('rule-duplicate'));
}

function closeDrawer() {
	fireEvent.keyDown(screen.getByTestId('rule-drawer'), { key: 'Escape' });
	expect(screen.queryByTestId('rule-drawer')).not.toBeInTheDocument();
}

describe('EditRuleButton', () => {
	it('shows the rule as it is now after the rule changes under an open drawer', () => {
		const { rerender } = render(<Harness rule={rule()} />);

		openEdit();
		expect(drawerField('rule-category')).toHaveTextContent('Known');

		rerender(<Harness rule={rule({ category: 'flaky' })} />);

		expect(drawerField('rule-category')).toHaveTextContent('Flaky');
	});

	it('reopens with the rule as saved, not as it was when first opened', () => {
		const { rerender } = render(<Harness rule={rule()} />);

		openEdit();
		closeDrawer();
		rerender(
			<Harness
				rule={rule({ category: 'flaky', expected: false, active: false })}
			/>
		);
		openEdit();

		expect(drawerField('rule-category')).toHaveTextContent('Flaky');
		expect(drawerField('rule-expected')).toHaveTextContent('Unexpected');
		expect(drawerField('rule-active')).toHaveTextContent('Inactive');
	});
});

describe('DuplicateRuleButton', () => {
	it('starts from the rule as it is now after the rule changes', () => {
		const { rerender } = render(<Harness rule={rule()} />);

		openDuplicate();
		closeDrawer();
		rerender(<Harness rule={rule({ category: 'flaky' })} />);
		openDuplicate();

		expect(drawerField('rule-category')).toHaveTextContent('Flaky');
	});
});
