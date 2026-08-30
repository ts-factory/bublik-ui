/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it, vi } from 'vitest';
import {
	RenderOptions,
	render as rtlRender,
	screen
} from '@testing-library/react';
import { PropsWithChildren, ReactElement, ReactNode, forwardRef } from 'react';

import { TooltipProvider } from '@/shared/tailwind-ui';
import type { ResultIssueRef } from '@/shared/types';

import {
	NO_EFFECT_META,
	RUN_ISSUE_EFFECT_META,
	UNTRIAGED_META,
	VERDICT_SLOT_CLASS,
	VERDICT_SLOT_MAX_LABEL
} from './classification-colors';

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

const { ResultIssueBadges } = await import('./classification-badges');

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
		render(
			<ResultIssueBadges hasError issues={[stamp({ issue_state: 'closed' })]} />
		);

		expect(keys()[0]).toHaveClass('line-through');
		expect(keys()[0]).toHaveAttribute('data-issue-state', 'closed');
	});

	it('leaves an open issue unstruck', () => {
		render(<ResultIssueBadges hasError issues={[stamp()]} />);

		expect(keys()[0]).not.toHaveClass('line-through');
		expect(keys()[0]).not.toHaveAttribute('data-issue-state');
	});

	/*
	 * The case the aggregate effect chip cannot express: it reports one answer
	 * for the whole result, so on a row carrying several stamps it cannot say
	 * which issue died. Per-key striking can.
	 */
	it('strikes only the closed stamp when a result carries several', () => {
		render(
			<ResultIssueBadges
				hasError
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
	 * A closed issue is a fact about the issue, not about the count, so it shows
	 * even where there is no count to affect.
	 */
	it('still strikes on a passing result, which carries no effect chip', () => {
		render(
			<ResultIssueBadges
				hasError={false}
				issues={[stamp({ issue_state: 'closed' })]}
			/>
		);

		expect(keys()[0]).toHaveClass('line-through');
		expect(screen.queryByTestId('result-issue-effect')).toBeNull();
	});

	/*
	 * `underline` and `line-through` are the same CSS property, so a hover
	 * underline would replace the strike and the issue would look alive exactly
	 * while you point at it.
	 */
	it('does not pair the strike with a hover underline', () => {
		render(
			<ResultIssueBadges hasError issues={[stamp({ issue_state: 'closed' })]} />
		);

		expect(keys()[0].className).not.toMatch(/hover:underline/);
	});
});

describe('ResultIssueBadges — effect chip', () => {
	it('reports the effect once for a failing result', () => {
		render(<ResultIssueBadges hasError issues={[stamp()]} />);

		expect(screen.getByTestId('result-issue-effect')).toBeInTheDocument();
	});

	it('reads untriaged for a failure nobody has classified', () => {
		render(<ResultIssueBadges hasError issues={[]} />);

		expect(screen.getByTestId('result-untriaged')).toBeInTheDocument();
	});

	it('renders nothing for a passing result with no stamps', () => {
		const { container } = render(
			<ResultIssueBadges hasError={false} issues={[]} />
		);

		expect(container).toBeEmptyDOMElement();
	});
});

describe('ResultIssueBadges — the Classify slot', () => {
	it('offers no trigger to a surface that passed no result', () => {
		render(<ResultIssueBadges hasError issues={[]} />);

		expect(screen.queryByTestId('classify-trigger')).not.toBeInTheDocument();
	});

	it('puts the trigger beside Untriaged on a failure nobody has classified', () => {
		render(<ResultIssueBadges hasError issues={[]} resultId={42} />);

		const trigger = screen.getByTestId('classify-trigger');

		expect(trigger).toHaveAttribute('data-result-id', '42');
		// Same line as the verdict, which is the whole point of moving it here.
		expect(screen.getByTestId('result-untriaged').parentElement).toBe(
			trigger.parentElement
		);
	});

	it('follows the verdict, from a slot wide enough that it never moves', () => {
		render(<ResultIssueBadges hasError issues={[stamp()]} resultId={42} />);

		const trigger = screen.getByTestId('classify-trigger');
		const line = trigger.parentElement;

		expect(line?.lastElementChild).toBe(trigger);
		// The six labels are six widths; the chip carrying its own width is what
		// stops the button landing at a different offset on every row — and it
		// has to be the chip, not a wrapper, or the space opens up beside it.
		expect(screen.getByTestId('result-issue-effect').firstElementChild)
			.toHaveClass(...VERDICT_SLOT_CLASS.split(' '));
	});

	it('offers the trigger on a passing result that carries stamps', () => {
		render(
			<ResultIssueBadges hasError={false} issues={[stamp()]} resultId={42} />
		);

		const trigger = screen.getByTestId('classify-trigger');

		expect(trigger.parentElement?.lastElementChild).toBe(trigger);
		expect(screen.getByTestId('result-no-effect')).toBeInTheDocument();
	});

	it('keeps the trigger on a failure that already carries a stamp', () => {
		render(<ResultIssueBadges hasError issues={[stamp()]} resultId={42} />);

		expect(screen.getByTestId('classify-trigger')).toBeInTheDocument();
		expect(screen.getByTestId('result-issue-effect')).toBeInTheDocument();
	});

	it('renders nothing at all for a passing, unstamped result', () => {
		const { container } = render(
			<ResultIssueBadges hasError={false} issues={[]} resultId={42} />
		);

		expect(container).toBeEmptyDOMElement();
	});
});

describe('ResultIssueBadges — the verdict slot', () => {
	it('answers with No effect when the result passed but carries stamps', () => {
		// `expected: true` on the stamp: run the effect axis over it and it would
		// report SUPPRESSED, claiming to have hidden a failure that never was.
		render(<ResultIssueBadges hasError={false} issues={[stamp()]} />);

		expect(screen.getByTestId('result-no-effect')).toBeInTheDocument();
		expect(screen.queryByTestId('result-issue-effect')).not.toBeInTheDocument();
	});

	it('fills the slot on every row it renders, so the column has no holes', () => {
		const rows = [
			{ hasError: true, issues: [] },
			{ hasError: true, issues: [stamp()] },
			{ hasError: false, issues: [stamp()] }
		];

		for (const row of rows) {
			const { container, unmount } = render(<ResultIssueBadges {...row} />);

			expect(
				container.querySelector(
					'[data-testid="result-untriaged"], [data-testid="result-issue-effect"], [data-testid="result-no-effect"]'
				)
			).not.toBeNull();

			unmount();
		}
	});
});

describe('the verdict slot budget', () => {
	it('holds every label that can land in it', () => {
		// The slot's width is a number in a class name; this is what keeps it
		// honest. A longer label starts pushing the Classify button around, and
		// that should fail here rather than turn up in a screenshot.
		const labels = [
			UNTRIAGED_META.label,
			NO_EFFECT_META.label,
			...Object.values(RUN_ISSUE_EFFECT_META).map((meta) => meta.label)
		];

		for (const label of labels) {
			expect(label.length).toBeLessThanOrEqual(VERDICT_SLOT_MAX_LABEL);
		}
	});
});
