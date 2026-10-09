/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';

import { TooltipProvider } from '@/shared/tailwind-ui';

import type { RuleFormSeed } from './rule-form.types';

vi.mock('@/services/bublik-api', () => {
	const idle = () => ({ data: undefined, isFetching: false });

	return {
		bublikAPI: { useGetAllProjectsQuery: () => ({ data: [] }) },
		useGetIssuePickerQuery: idle,
		useGetIssueQuery: idle,
		useGetIssueSearchOptionsQuery: idle,
		useGetTestPickerQuery: idle,
		useGetTestSearchOptionsQuery: idle
	};
});

// The SVG icons do not load under vitest; a stub per name keeps `Icon` rendering.
vi.mock('@/icons', async (importOriginal) => {
	const Stub = (props: Record<string, unknown>) => <svg {...props} />;
	const icons = await importOriginal<Record<string, unknown>>();

	return Object.fromEntries(Object.keys(icons).map((name) => [name, Stub]));
});

vi.mock('@/bublik/features/projects', () => ({
	LinkWithProject: () => null,
	useProjectSearch: () => ({ projectIds: [] })
}));

vi.mock('../classify/classify-button.container', () => ({
	ClassifyButton: () => null
}));

const { RuleFields } = await import('./rule-form.component');
const { useRuleForm } = await import('./rule-form.hooks');

interface HarnessProps {
	mode: 'create' | 'edit';
	lockIssue?: boolean;
	seed?: RuleFormSeed;
}

function Harness({ mode, lockIssue, seed = {} }: HarnessProps) {
	const form = useRuleForm(seed);

	return (
		<TooltipProvider>
			<RuleFields form={form} mode={mode} lockIssue={lockIssue} />
		</TooltipProvider>
	);
}

function issueField() {
	return within(screen.getByTestId('rule-issue'));
}

function issueInput() {
	return issueField().getByTestId('issue-picker-input');
}

function expectIssueLocked() {
	expect(issueInput()).toBeDisabled();
	expect(
		issueField().getByRole('button', { name: 'Open issue list' })
	).toBeDisabled();
	expect(
		issueField().queryByRole('button', { name: 'Clear issue' })
	).not.toBeInTheDocument();
}

describe('RuleFields issue picker', () => {
	it('is locked when the rule is created from an issue', () => {
		render(<Harness mode="create" lockIssue seed={{ issueId: 7 }} />);

		expectIssueLocked();
	});

	it('is locked when editing a rule, since an update keeps the issue', () => {
		render(<Harness mode="edit" seed={{ issueId: 7 }} />);

		expectIssueLocked();
	});

	it('is editable on a plain create', () => {
		render(<Harness mode="create" />);

		expect(issueInput()).toBeEnabled();
	});
});
