/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { TooltipProvider } from '@/shared/tailwind-ui';
import type { ClassifyOptions, ClassifyRuleOptions } from '@/shared/types';

import type { ClassifyForm } from '../classify/classify-form.types';

const RULE: ClassifyRuleOptions = {
	test_id: 21,
	test_name: 'ethtool_reset_nic',
	test_path: 'net-drv-ts/basic/ethtool_reset_nic',
	run_ids: [7],
	result_ids: [1, 2],
	parameters: { env: 'VM', flag: 'DEDICATED' },
	verdicts: [['Packet lost']],
	tags: {
		default: ['fixture=net-drv-ts'],
		allowed: ['fixture=net-drv-ts', 'sfc']
	}
};

const OTHER: ClassifyRuleOptions = {
	...RULE,
	test_id: 22,
	test_name: 'rx_fcs',
	test_path: 'net-drv-ts/rx_path/rx_fcs',
	result_ids: [3, 4],
	parameters: { mtu: '1500' },
	// One result failed with two verdicts, the other with none.
	verdicts: [['Packet lost', 'Timeout'], []]
};

/** The first test again, with another `env`, in a run with one more tag. */
const RULE_HW: ClassifyRuleOptions = {
	...RULE,
	run_ids: [8],
	result_ids: [5],
	parameters: { env: 'HW', flag: 'DEDICATED' },
	verdicts: [['Link down']],
	tags: {
		default: ['fixture=net-drv-ts', 'kernel=6.2'],
		allowed: ['fixture=net-drv-ts', 'kernel=6.2', 'sfc']
	}
};

// What the mocked endpoint answers; a test may swap it for other results.
const served: { options: ClassifyOptions } = { options: [RULE] };

vi.mock('@/services/bublik-api', () => ({
	useGetClassifyOptionsQuery: () => ({
		data: served.options,
		isLoading: false,
		isError: false
	})
}));

// The SVG icons do not load under vitest; a stub per name keeps `Icon` rendering.
vi.mock('@/icons', async (importOriginal) => {
	const Stub = (props: Record<string, unknown>) => <svg {...props} />;
	const icons = await importOriginal<Record<string, unknown>>();

	return Object.fromEntries(Object.keys(icons).map((name) => [name, Stub]));
});

// jsdom has no layout; cmdk scrolls the active row into view on open.
Element.prototype.scrollIntoView = vi.fn();

const { MatchScope } = await import('./match-scope.component');
const { useClassifyForm } = await import('../classify/classify-form.hooks');

function renderScope(...options: ClassifyRuleOptions[]) {
	const ref: { form?: ClassifyForm } = {};

	served.options = options.length ? options : [RULE];
	const runs = [
		{ resultIds: served.options.flatMap((rule) => rule.result_ids) }
	];

	function Harness() {
		const form = useClassifyForm();

		ref.form = form;

		return <MatchScope form={form} runs={runs} />;
	}

	render(
		<TooltipProvider>
			<Harness />
		</TooltipProvider>
	);

	return ref;
}

// Held for the whole test: a click re-renders, and the mock answers again.
afterEach(() => {
	served.options = [RULE];
});

function cards() {
	return screen.getAllByTestId('match-scope-test');
}

function card(testId: number) {
	return cards().find(
		(element) => element.getAttribute('data-test-id') === String(testId)
	) as HTMLElement;
}

function chips(scope: HTMLElement, field: string) {
	return within(scope)
		.getByTestId(`match-scope-${field}`)
		.querySelectorAll('[data-testid="scope-value-chip"]');
}

function values(scope: HTMLElement, field: string) {
	return Array.from(chips(scope, field)).map((chip) =>
		chip.getAttribute('data-value')
	);
}

/** The verdict lists a card keeps, a row each; none once dropped. */
function verdictLists(scope: HTMLElement) {
	return Array.from(
		within(scope).getAllByTestId('match-scope-verdict-list')
	).map((row) =>
		Array.from(row.querySelectorAll('[data-testid="scope-value-chip"]')).map(
			(chip) => chip.getAttribute('data-value')
		)
	);
}

function verdictsKept(scope: HTMLElement) {
	return (
		within(scope)
			.getByTestId('match-scope-verdicts')
			.getAttribute('data-kept') === 'true'
	);
}

describe('MatchScope', () => {
	it('starts with every parameter and the important tags kept', () => {
		renderScope();

		const [only] = cards();

		expect(values(only, 'parameters')).toEqual(['env', 'flag']);
		expect(verdictLists(only)).toEqual([['Packet lost']]);
		expect(values(screen.getByTestId('match-scope'), 'tags')).toEqual([
			'fixture=net-drv-ts'
		]);
	});

	it('keeps every verdict list of a test, a rule each, and counts the rules', () => {
		renderScope(RULE, OTHER);

		expect(verdictLists(card(22))).toEqual([['Packet lost', 'Timeout'], ['']]);
		expect(
			within(within(card(22)).getByTestId('match-scope-verdicts')).getByText(
				'No verdicts'
			)
		).toBeInTheDocument();
		expect(within(card(22)).getByTestId('match-scope-rules')).toHaveTextContent(
			'2 rules'
		);
		expect(within(card(21)).queryByTestId('match-scope-rules')).toBeNull();
		expect(screen.getByText('2 tests, 3 rules')).toBeInTheDocument();
	});

	it('shows one card per test, titled with its path', () => {
		renderScope(RULE, OTHER);

		expect(cards()).toHaveLength(2);
		expect(
			within(card(22)).getByTestId('match-scope-test-path')
		).toHaveTextContent('net-drv-ts/rx_path/rx_fcs');
	});

	it('says one rule each when no test keeps several verdict lists', () => {
		renderScope(RULE, { ...OTHER, verdicts: [['Timeout']] });

		expect(screen.getByText('2 tests, one rule each')).toBeInTheDocument();
	});

	it('removes a chip from one test without touching the other', () => {
		const ref = renderScope(RULE, OTHER);

		fireEvent.click(
			within(card(21)).getByRole('button', { name: 'Remove env: VM' })
		);

		expect(values(card(21), 'parameters')).toEqual(['flag']);
		expect(values(card(22), 'parameters')).toEqual(['mtu']);
		expect(ref.form?.getValues('picks.tests.21.parameters')).toEqual(['flag']);
	});

	it('empties a field from its bin', () => {
		renderScope();

		fireEvent.click(screen.getByRole('button', { name: 'Clear parameters' }));

		expect(values(cards()[0], 'parameters')).toEqual([]);
	});

	it('drops the verdicts from their bin and restores them from the Restore pill', () => {
		const ref = renderScope();

		const only = cards()[0];

		fireEvent.click(screen.getByRole('button', { name: 'Clear verdicts' }));

		expect(verdictsKept(only)).toBe(false);
		expect(within(only).queryAllByTestId('match-scope-verdict-list')).toEqual(
			[]
		);
		expect(
			within(only).getByText('Not kept: not matched on')
		).toBeInTheDocument();
		expect(ref.form?.getValues('picks.tests.21.verdicts')).toBe(false);

		fireEvent.click(screen.getByRole('button', { name: 'Restore verdicts' }));

		expect(verdictsKept(only)).toBe(true);
		expect(verdictLists(only)).toEqual([['Packet lost']]);
	});

	it('warns inside the card once a dimension is emptied, and when all are', () => {
		renderScope();

		const only = cards()[0];

		fireEvent.click(screen.getByRole('button', { name: 'Clear verdicts' }));

		expect(
			within(only).getByTestId('match-scope-unnarrowed')
		).toHaveTextContent('Any verdicts will match: they are not kept.');
		expect(within(only).getByTestId('match-scope-standing')).toHaveTextContent(
			'any verdicts'
		);

		for (const name of ['env: VM', 'flag: DEDICATED', 'fixture: net-drv-ts']) {
			fireEvent.click(screen.getByRole('button', { name: `Remove ${name}` }));
		}

		expect(
			within(only).getByTestId('match-scope-unnarrowed')
		).toHaveTextContent(
			'Every failure of this test will match: nothing but the path is kept.'
		);
		expect(within(only).getByTestId('match-scope-standing')).toHaveTextContent(
			'path only'
		);
	});

	it('says when the results of a test have no parameter', () => {
		renderScope(RULE, { ...OTHER, parameters: {} });

		expect(
			within(card(22)).getByTestId('match-scope-unnarrowed')
		).toHaveTextContent(
			'Any parameters will match: the selected results have none.'
		);
		expect(within(card(21)).queryByTestId('match-scope-unnarrowed')).toBeNull();
	});

	it("empties and restores one test's pickers from the card's buttons", () => {
		const ref = renderScope(RULE, OTHER);

		fireEvent.click(
			within(card(21)).getByRole('button', {
				name: "Empty this test's pickers: match on its path alone"
			})
		);

		expect(values(card(21), 'parameters')).toEqual([]);
		expect(verdictsKept(card(21))).toBe(false);
		expect(values(card(22), 'parameters')).toEqual(['mtu']);
		expect(verdictsKept(card(22))).toBe(true);

		fireEvent.click(
			within(card(21)).getByRole('button', {
				name: 'This test back to everything its results have'
			})
		);

		expect(values(card(21), 'parameters')).toEqual(['env', 'flag']);
		expect(verdictsKept(card(21))).toBe(true);
		expect(ref.form?.getValues('picks.tests.21')).toEqual({
			parameters: null,
			verdicts: null
		});
	});

	it('folds away for results classified just this once, keeping the picks', async () => {
		const ref = renderScope();

		fireEvent.click(screen.getByRole('button', { name: 'Remove env: VM' }));
		ref.form?.setValue('scope', 'oneoff');

		expect(await screen.findByTestId('match-scope-oneoff')).toBeInTheDocument();
		expect(screen.queryByTestId('match-scope-test')).toBeNull();

		ref.form?.setValue('scope', 'future');

		expect(await screen.findByTestId('match-scope-test')).toBeInTheDocument();
		expect(values(cards()[0], 'parameters')).toEqual(['flag']);
	});

	it('gives results that differ rules of their own, and lists them', () => {
		renderScope(RULE, RULE_HW);

		const [only] = cards();

		expect(cards()).toHaveLength(1);
		expect(values(only, 'parameters')).toEqual(['env', 'flag']);
		expect(
			within(only).getByRole('button', { name: 'Remove env: 2 values' })
		).toBeInTheDocument();
		expect(verdictLists(only)).toEqual([['Packet lost'], ['Link down']]);
		expect(values(screen.getByTestId('match-scope'), 'tags')).toEqual([
			'fixture=net-drv-ts',
			'kernel=6.2'
		]);
		expect(within(only).getByTestId('match-scope-rules')).toHaveTextContent(
			'2 rules'
		);
		const rows = within(only).getAllByTestId('match-scope-written-rule');

		// Every rule in full: its parameters, its verdicts and its tags.
		expect(rows).toHaveLength(2);
		expect(rows[0]).toHaveTextContent('Rule 1');
		expect(rows[0]).toHaveTextContent('env: VM');
		expect(rows[0]).toHaveTextContent('Packet lost');
		expect(rows[0]).toHaveTextContent('fixture: net-drv-ts');
		expect(rows[0]).not.toHaveTextContent('kernel: 6.2');
		expect(rows[1]).toHaveTextContent('env: HW');
		expect(rows[1]).toHaveTextContent('Link down');
		expect(rows[1]).toHaveTextContent('kernel: 6.2');
	});

	it('merges the rules once nothing tells them apart', () => {
		renderScope(RULE, RULE_HW);

		const [only] = cards();

		fireEvent.click(
			within(only).getByRole('button', { name: 'Remove env: 2 values' })
		);

		// The second run's own important tag still does.
		expect(
			within(only).getAllByTestId('match-scope-written-rule')
		).toHaveLength(2);

		fireEvent.click(screen.getByRole('button', { name: 'Remove kernel: 6.2' }));

		// One rule per verdict list of the three results.
		expect(
			within(only).getAllByTestId('match-scope-written-rule')
		).toHaveLength(2);
		expect(within(only).getByTestId('match-scope-rules')).toHaveTextContent(
			'2 rules'
		);

		fireEvent.click(screen.getByRole('button', { name: 'Clear verdicts' }));

		expect(within(only).queryByTestId('match-scope-rules')).toBeNull();
		expect(
			within(only).getAllByTestId('match-scope-written-rule')
		).toHaveLength(1);
	});
});
