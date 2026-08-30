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

import { categoryMeta } from './classification-colors';

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

// The real trigger opens a drawer wired to RTK Query; what matters here is
// only whether it is offered, and where it sits relative to the verdict chip.
vi.mock('./classify-button', () => ({
	ClassifyButton: ({ resultId }: { resultId: number }) => (
		<button data-testid="classify-trigger" data-result-id={resultId}>
			Classify
		</button>
	)
}));

const { ClassificationVerdict, ResultIssueBadges } = await import(
	'./classification-badges'
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

/** The key chip, which is where the closed strike lives. */
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

	/*
	 * The case the aggregate verdict chip cannot express: it reports one answer
	 * for the whole result, so on a row carrying several issues it cannot say
	 * which of them died. Per-key striking can.
	 */
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

	/*
	 * `underline` and `line-through` are the same CSS property, so a hover
	 * underline would replace the strike and the issue would look alive exactly
	 * while you point at it.
	 */
	it('does not pair the strike with a hover underline', () => {
		render(<ResultIssueBadges issues={[stamp({ issue_state: 'closed' })]} />);

		expect(keys()[0].className).not.toMatch(/hover:underline/);
	});
});

describe('ClassificationVerdict — the verdict chip', () => {
	it('reports the effect once for a failing result', () => {
		render(<ClassificationVerdict hasError issues={[stamp()]} />);

		expect(screen.getByTestId('result-issue-effect')).toBeInTheDocument();
	});

	it('reads untriaged for a failure nobody has classified', () => {
		render(<ClassificationVerdict hasError issues={[]} />);

		expect(screen.getByTestId('result-untriaged')).toBeInTheDocument();
	});

	it('answers with No effect when the result passed but carries stamps', () => {
		// `expected: true` on the stamp: run the effect axis over it and it would
		// report SUPPRESSED, claiming to have hidden a failure that never was.
		render(<ClassificationVerdict hasError={false} issues={[stamp()]} />);

		expect(screen.getByTestId('result-no-effect')).toBeInTheDocument();
		expect(screen.queryByTestId('result-issue-effect')).not.toBeInTheDocument();
	});

	it('renders nothing for a passing result with no stamps', () => {
		const { container } = render(
			<ClassificationVerdict hasError={false} issues={[]} />
		);

		expect(container).toBeEmptyDOMElement();
	});

	it('fills the slot on every row it renders, so the column has no holes', () => {
		const rows = [
			{ hasError: true, issues: [] },
			{ hasError: true, issues: [stamp()] },
			{ hasError: false, issues: [stamp()] }
		];

		for (const row of rows) {
			const { container, unmount } = render(<ClassificationVerdict {...row} />);

			expect(
				container.querySelector(
					'[data-testid="result-untriaged"], [data-testid="result-issue-effect"], [data-testid="result-no-effect"]'
				)
			).not.toBeNull();

			unmount();
		}
	});
});

describe('ClassificationVerdict — the Classify slot', () => {
	it('offers no trigger to a surface that passed no result', () => {
		render(<ClassificationVerdict hasError issues={[]} />);

		expect(screen.queryByTestId('classify-trigger')).not.toBeInTheDocument();
	});

	it('puts the trigger beside Untriaged on a failure nobody has classified', () => {
		render(<ClassificationVerdict hasError issues={[]} resultId={42} />);

		const trigger = screen.getByTestId('classify-trigger');

		expect(trigger).toHaveAttribute('data-result-id', '42');
		// Same line as the verdict, which is the whole point of moving it here.
		expect(screen.getByTestId('result-untriaged').parentElement).toBe(
			trigger.parentElement
		);
	});

	it('trails the verdict: what happened, then what you can do about it', () => {
		render(<ClassificationVerdict hasError issues={[stamp()]} resultId={42} />);

		const verdict = screen.getByTestId('result-issue-effect');
		const trigger = screen.getByTestId('classify-trigger');

		expect(
			verdict.compareDocumentPosition(trigger) &
				Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy();
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
		expect(screen.getByTestId('result-no-effect')).toBeInTheDocument();
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
		// `contents` is what does it: the wrapper keeps the e2e hooks and stops
		// being a box, so the key and the categories land in the shared columns and
		// the categories line up however long the keys are.
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

	/*
	 * A result carries one stamp per matching *rule*, so an issue with three
	 * rules used to print its key three times and read as three bugs.
	 */
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
		// One badge per category, so each stays its own filter control.
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

		// Which outline a selected chip draws is `Badge`'s business — it derives
		// one from the chip's own variant — so this asks only that the selected
		// chip does not look like the unselected one beside it.
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

		// The whole point of the exercise: a red chip selects red and a violet
		// one violet, the way the obtained-result badge beside them already
		// behaves. Both wearing `border-primary` is what this replaced.
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

		// A read-only surface passes no handler, and must promise nothing.
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
