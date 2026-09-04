/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it, vi } from 'vitest';
import {
	RenderOptions,
	render as rtlRender,
	screen
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PropsWithChildren, ReactElement, ReactNode, forwardRef } from 'react';

import { TooltipProvider } from '@/shared/tailwind-ui';
import type { ResultIssueRef } from '@/shared/types';

import { categoryMeta } from './classification.utils';

vi.mock('@/bublik/features/projects', () => {
	interface MockLinkProps {
		to: string | { pathname?: string };
		children: ReactNode;
	}

	return {
		LinkWithProject: forwardRef<
			HTMLAnchorElement,
			MockLinkProps & Record<string, unknown>
		>(({ to, children, ...props }, ref) => (
			<a ref={ref} href={typeof to === 'string' ? to : to.pathname} {...props}>
				{children}
			</a>
		))
	};
});

vi.mock('../classify/classify-button.container', () => ({
	ClassifyButton: ({ resultId }: { resultId: number }) => (
		<button data-testid="classify-trigger" data-result-id={resultId}>
			Classify
		</button>
	)
}));

const { ClassificationVerdict, ProjectBadge, ResultIssueBadges } = await import(
	'./classification-badges.component'
);

const render = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
	rtlRender(ui, {
		wrapper: (props: PropsWithChildren) => (
			<TooltipProvider delayDuration={0}>{props.children}</TooltipProvider>
		),
		...options
	});

let ruleId = 0;

function stamp(partial: Partial<ResultIssueRef> = {}): ResultIssueRef {
	return {
		issue_id: 1,
		issue_title: 'Issue',
		issue_state: 'open',
		bug_key: 'ref://JIRA/E2E-123',
		category: 'known-issue',
		expected: true,
		rule_id: ++ruleId,
		origin: 'import',
		...partial
	};
}

const keys = () => screen.getAllByText(/^(E2E-|#)/);

describe('ResultIssueBadges — closed issues', () => {
	it('strikes the key of a stamp whose issue is closed', () => {
		render(<ResultIssueBadges issues={[stamp({ issue_state: 'closed' })]} />);

		expect(keys()[0]).toHaveClass('line-through');
		expect(keys()[0]).toHaveAttribute('data-issue-state', 'closed');
	});

	it('leaves an open issue unstruck', () => {
		render(<ResultIssueBadges issues={[stamp()]} />);

		expect(keys()[0]).not.toHaveClass('line-through');
		expect(keys()[0]).not.toHaveAttribute('data-issue-state');
	});

	it('strikes only the closed issue when a result carries several', () => {
		render(
			<ResultIssueBadges
				issues={[
					stamp({ issue_id: 1, bug_key: 'ref://JIRA/E2E-123' }),
					stamp({
						issue_id: 2,
						bug_key: 'ref://JIRA/E2E-140',
						issue_state: 'closed'
					})
				]}
			/>
		);

		expect(screen.getByText('E2E-123')).not.toHaveClass('line-through');
		expect(screen.getByText('E2E-140')).toHaveClass('line-through');
	});

	it('does not pair the strike with a hover underline', () => {
		render(<ResultIssueBadges issues={[stamp({ issue_state: 'closed' })]} />);

		expect(keys()[0].className).not.toMatch(/hover:underline/);
	});
});

describe('ClassificationVerdict — no chip, only the trigger', () => {
	it('draws no verdict chip on any kind of row', () => {
		const rows = [
			{ hasError: true, issues: [] },
			{ hasError: true, issues: [stamp()] },
			{ hasError: false, issues: [stamp()] }
		];

		for (const row of rows) {
			const { container, unmount } = render(
				<ClassificationVerdict {...row} resultId={42} />
			);

			expect(container.querySelectorAll('[data-effect]')).toHaveLength(0);
			expect(
				container.querySelector('[data-testid="result-untriaged"]')
			).toBeNull();

			unmount();
		}
	});

	it('leaves a read-only surface with nothing to draw', () => {
		for (const hasError of [true, false]) {
			const { container, unmount } = render(
				<ClassificationVerdict hasError={hasError} issues={[stamp()]} />
			);

			expect(container).toBeEmptyDOMElement();

			unmount();
		}
	});
});

describe('ClassificationVerdict — the Classify slot', () => {
	it('offers no trigger to a surface that passed no result', () => {
		render(<ClassificationVerdict hasError issues={[]} />);

		expect(screen.queryByTestId('classify-trigger')).not.toBeInTheDocument();
	});

	it('offers the trigger on a failure nobody has classified', () => {
		render(<ClassificationVerdict hasError issues={[]} resultId={42} />);

		expect(screen.getByTestId('classify-trigger')).toHaveAttribute(
			'data-result-id',
			'42'
		);
	});

	it('offers the trigger on a failure the rules already explain', () => {
		render(<ClassificationVerdict hasError issues={[stamp()]} resultId={42} />);

		expect(screen.getByTestId('classify-trigger')).toBeInTheDocument();
	});

	it('offers the trigger on a passing result that carries stamps', () => {
		render(
			<ClassificationVerdict
				hasError={false}
				issues={[stamp()]}
				resultId={42}
			/>
		);

		expect(screen.getByTestId('classify-trigger')).toBeInTheDocument();
	});

	it('renders nothing at all for a passing, unstamped result', () => {
		const { container } = render(
			<ClassificationVerdict hasError={false} issues={[]} resultId={42} />
		);

		expect(container).toBeEmptyDOMElement();
	});
});

describe('ResultIssueBadges — one line per issue', () => {
	it("puts each issue's chips in the columns rather than in a row of its own", () => {
		render(
			<ResultIssueBadges
				issues={[
					stamp({ issue_id: 1, bug_key: 'ref://JIRA/E2E-1' }),
					stamp({ issue_id: 2, bug_key: 'ref://JIRA/E2E-12345' })
				]}
			/>
		);

		const rows = screen.getAllByTestId('result-issue-stamp');

		expect(rows).toHaveLength(2);
		for (const el of rows) expect(el).toHaveClass('contents');
	});

	it('collapses an issue matched by several rules onto one line', () => {
		render(
			<ResultIssueBadges
				issues={[
					stamp({ issue_id: 7, category: 'env' }),
					stamp({ issue_id: 7, category: 'flaky' }),
					stamp({ issue_id: 7, category: 'to-investigate' })
				]}
			/>
		);

		const rows = screen.getAllByTestId('result-issue-stamp');

		expect(rows).toHaveLength(1);
		expect(rows[0]).toHaveAttribute('data-issue-id', '7');
		expect(keys()).toHaveLength(1);
		expect(rows[0].querySelectorAll('[data-category]')).toHaveLength(3);
	});

	it('keeps every category a filter control of its own', async () => {
		const onCategoryClick = vi.fn();

		render(
			<ResultIssueBadges
				issues={[
					stamp({ issue_id: 7, category: 'env' }),
					stamp({ issue_id: 7, category: 'flaky' })
				]}
				selectedCategories={['env']}
				onCategoryClick={onCategoryClick}
			/>
		);

		const env = screen.getByText(categoryMeta('env').label);
		const flaky = screen.getByText(categoryMeta('flaky').label);

		expect(env.className).not.toBe(flaky.className);

		await userEvent.click(flaky);

		expect(onCategoryClick).toHaveBeenCalledWith('flaky');
	});

	it('outlines a selected chip in its own hue, never a house blue', () => {
		render(
			<ResultIssueBadges
				issues={[
					stamp({ issue_id: 7, category: 'product-defect' }),
					stamp({ issue_id: 7, category: 'to-investigate' })
				]}
				selectedCategories={['product-defect', 'to-investigate']}
				onCategoryClick={vi.fn()}
			/>
		);

		expect(
			screen.getByText(categoryMeta('product-defect').label).className
		).toContain('border-text-unexpected');
		expect(
			screen.getByText(categoryMeta('to-investigate').label).className
		).toContain('border-text-triage');
	});

	it('hints at the click before it happens, and only on real controls', () => {
		const { rerender } = render(
			<ResultIssueBadges
				issues={[stamp({ issue_id: 7, category: 'env' })]}
				onCategoryClick={vi.fn()}
			/>
		);

		expect(screen.getByText(categoryMeta('env').label).className).toContain(
			'hover:border-accent-env/40'
		);

		rerender(
			<ResultIssueBadges issues={[stamp({ issue_id: 7, category: 'env' })]} />
		);

		expect(screen.getByText(categoryMeta('env').label).className).not.toMatch(
			/hover:border-/
		);
	});

	it('renders nothing — not even its rule — when there are no stamps', () => {
		const { container } = render(
			<ResultIssueBadges issues={[]} withSeparator />
		);

		expect(container).toBeEmptyDOMElement();
	});
});

describe('ProjectBadge', () => {
	it('names the project it filters to', () => {
		render(<ProjectBadge name="tsf/net-drv" />);

		expect(screen.getByText('tsf/net-drv')).toHaveAttribute(
			'data-project-name',
			'tsf/net-drv'
		);
	});

	it('toggles the filter when clicked', async () => {
		const onClick = vi.fn();
		render(<ProjectBadge name="tsf/net-drv" onClick={onClick} />);

		await userEvent.click(screen.getByText('tsf/net-drv'));

		expect(onClick).toHaveBeenCalledOnce();
	});

	it('is inert where no filter is wired to it', () => {
		render(<ProjectBadge name="tsf/net-drv" />);

		expect(screen.getByText('tsf/net-drv')).not.toHaveAttribute(
			'type',
			'button'
		);
	});

	it('takes the button affordance once one is', () => {
		render(<ProjectBadge name="tsf/net-drv" onClick={vi.fn()} />);

		expect(screen.getByText('tsf/net-drv')).toHaveAttribute('type', 'button');
	});
});
