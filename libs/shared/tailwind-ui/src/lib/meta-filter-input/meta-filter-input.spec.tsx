/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { FormEvent, useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MetaFilterInput, MetaFilterInputProps } from './meta-filter-input';
import { MetaFilterChip } from './types';
import { TooltipProvider } from '../tooltip';

const GROUPS = [
	{ label: 'Important', items: ['conclusion=interrupted', 'conclusion=busy'] },
	{ label: 'Metadata', items: ['pci=15b3', 'pci=8086', 'proto=udp'] },
	{ label: 'Tags', items: ['medford', 'pci-15b3', 'pci-sub-15b3', 'ipv6'] }
];

beforeAll(() => {
	// Radix measures the anchor with a ResizeObserver, which jsdom lacks.
	globalThis.ResizeObserver ??= class {
		observe() {
			/* noop */
		}
		unobserve() {
			/* noop */
		}
		disconnect() {
			/* noop */
		}
	};
});

type HostProps = Omit<
	MetaFilterInputProps,
	'chips' | 'onChipsChange' | 'label'
> & {
	label?: string;
	initialChips?: MetaFilterChip[];
	onChange?: (chips: MetaFilterChip[]) => void;
};

function Host({
	onChange,
	initialChips = [],
	label = 'Tags',
	...props
}: HostProps) {
	const [chips, setChips] = useState<MetaFilterChip[]>(initialChips);

	return (
		<TooltipProvider>
			<MetaFilterInput
				label={label}
				keyValueDisplayDelimiter=": "
				keyValueSubmitDelimiter="="
				suggestions={GROUPS}
				{...props}
				chips={chips}
				onChipsChange={(next) => {
					setChips(next);
					onChange?.(next);
				}}
			/>
		</TooltipProvider>
	);
}

function input() {
	return screen.getByRole('combobox', { name: 'Tags' });
}

function chipTexts() {
	return screen.getAllByTestId('meta-filter-chip').map((chip) => ({
		text: chip.getAttribute('data-value'),
		kind: chip.getAttribute('data-kind')
	}));
}

function listbox() {
	return screen.getByRole('listbox');
}

describe('MetaFilterInput value chips', () => {
	it('adds a suggestion picked from the list as a value chip', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<Host onChange={onChange} />);

		await user.click(input());
		await user.type(input(), '15b3');

		const option = within(listbox()).getByRole('option', { name: /pci: 15b3/ });
		await user.click(option);

		expect(chipTexts()).toEqual([{ text: 'pci=15b3', kind: 'value' }]);
		expect(onChange).toHaveBeenLastCalledWith([
			expect.objectContaining({ value: 'pci=15b3', isExpression: false })
		]);
		expect(input()).toHaveValue('15b3');
		expect(input()).toHaveFocus();
	});

	it('drops the query of a pick when the field closes', async () => {
		const user = userEvent.setup();
		render(<Host />);

		await user.click(input());
		await user.type(input(), '15b3');
		await user.click(
			within(listbox()).getByRole('option', { name: /pci: 15b3/ })
		);
		await user.click(document.body);

		expect(input()).toHaveValue('');
		expect(chipTexts()).toEqual([{ text: 'pci=15b3', kind: 'value' }]);
	});

	it('keeps typed text that picked nothing when the field closes', async () => {
		const user = userEvent.setup();
		render(<Host />);

		await user.click(input());
		await user.type(input(), '15b3');
		await user.click(document.body);

		expect(input()).toHaveValue('15b3');
	});

	it('toggles the highlighted suggestion on Enter and keeps it highlighted', async () => {
		const user = userEvent.setup();
		render(<Host />);

		await user.click(input());
		await user.type(input(), 'medf');
		await user.keyboard('{ArrowDown}{Enter}');

		expect(chipTexts()).toEqual([{ text: 'medford', kind: 'value' }]);
		const option = within(listbox()).getByRole('option', { name: /medford/ });
		expect(option).toHaveAttribute('aria-selected', 'true');
		expect(option).toHaveAttribute('data-highlighted', 'true');
		expect(input()).toHaveFocus();

		await user.keyboard('{Enter}');
		expect(screen.queryAllByTestId('meta-filter-chip')).toHaveLength(0);
	});

	it('ticks several suggestions with the arrows and Enter', async () => {
		const user = userEvent.setup();
		render(<Host />);

		await user.click(input());
		await user.type(input(), 'pci');
		await user.keyboard('{ArrowDown}{Enter}{ArrowDown}{Enter}');

		expect(chipTexts()).toHaveLength(2);
		expect(input()).toHaveFocus();
	});

	it('adds typed text that matches nothing as a value chip', async () => {
		const user = userEvent.setup();
		render(<Host />);

		await user.click(input());
		await user.type(input(), 'arm64{Enter}');

		expect(chipTexts()).toEqual([{ text: 'arm64', kind: 'value' }]);
	});

	it('lets Tab leave the field while no row is chosen', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<>
				<Host onChange={onChange} />
				<button type="button">Next</button>
			</>
		);

		await user.click(input());
		await user.type(input(), 'medf');
		await user.keyboard('{Tab}');

		expect(input()).not.toHaveFocus();
		expect(input()).toHaveValue('medf');
		expect(onChange).not.toHaveBeenCalled();
	});

	it('fills in the chosen suggestion with Tab so an operator can follow', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<Host onChange={onChange} />);

		await user.click(input());
		await user.type(input(), 'medf');
		await user.keyboard('{ArrowDown}{Tab}');

		expect(input()).toHaveValue('medford ');
		expect(input()).toHaveFocus();
		expect(onChange).not.toHaveBeenCalled();

		await user.type(input(), '| ipv6 {Enter}');
		expect(chipTexts()).toEqual([
			{ text: 'medford | ipv6', kind: 'expression' }
		]);
	});

	it('fills in the row chosen with the arrows on Tab', async () => {
		const user = userEvent.setup();
		render(<Host />);

		await user.click(input());
		await user.type(input(), 'pci');
		await user.keyboard('{ArrowDown}{ArrowDown}{Tab}');

		expect(input()).toHaveValue('pci: 8086 ');
	});

	it('removes the last chip with Backspace in an empty input', async () => {
		const user = userEvent.setup();
		render(
			<Host
				initialChips={[
					{ id: '1', value: 'medford', isExpression: false },
					{ id: '2', value: 'ipv6', isExpression: false }
				]}
			/>
		);

		await user.click(input());
		await user.keyboard('{Backspace}');

		expect(chipTexts()).toEqual([{ text: 'medford', kind: 'value' }]);
	});
});

describe('MetaFilterInput expressions', () => {
	it('switches to expression mode on an operator and commits one chip on Enter', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<Host onChange={onChange} />);

		await user.click(input());
		expect(screen.getByRole('radio', { name: 'Value' })).toHaveAttribute(
			'aria-checked',
			'true'
		);

		await user.type(input(), 'pci-15b3 | pci-sub-15b3');

		expect(screen.getByRole('radio', { name: 'Expression' })).toHaveAttribute(
			'aria-checked',
			'true'
		);
		expect(screen.getByRole('radio', { name: 'Value' })).toBeDisabled();
		expect(screen.getByText(/Valid expression/)).toBeInTheDocument();

		await user.keyboard('{Enter}');

		expect(chipTexts()).toEqual([
			{ text: 'pci-15b3 | pci-sub-15b3', kind: 'expression' }
		]);
		expect(screen.getByRole('radio', { name: 'Expression' })).toHaveAttribute(
			'aria-checked',
			'true'
		);
		expect(onChange).toHaveBeenLastCalledWith([
			expect.objectContaining({
				value: 'pci-15b3 | pci-sub-15b3',
				isExpression: true
			})
		]);
		expect(input()).toHaveValue('');
	});

	it('completes the name under the caret with Tab without committing', async () => {
		const user = userEvent.setup();
		render(<Host />);

		await user.click(input());
		await user.type(input(), '!pci-s');

		const option = within(listbox()).getByRole('option', {
			name: /pci-sub-15b3/
		});
		expect(option).toBeInTheDocument();
		expect(within(option).queryByRole('checkbox')).toBeNull();

		await user.keyboard('{Tab}');

		expect(input()).toHaveValue('!pci-sub-15b3 ');
		expect(screen.queryAllByTestId('meta-filter-chip')).toHaveLength(0);
	});

	it('adds the expression on Enter even while the word under the caret has matches', async () => {
		const user = userEvent.setup();
		render(<Host />);

		await user.click(input());
		// `pci-s` starts `pci-sub-15b3`; `15b3` only occurs in `pci-15b3`.
		await user.type(input(), 'medford | pci-s{Enter}');
		await user.type(input(), '15b3 | ipv6{Enter}');

		expect(chipTexts()).toEqual([
			{ text: 'medford | pci-s', kind: 'expression' },
			{ text: '15b3 | ipv6', kind: 'expression' }
		]);
	});

	it('lists what the word starts before what it merely contains', async () => {
		const user = userEvent.setup();
		render(<Host />);

		await user.click(input());
		await user.type(input(), '!i');

		const tags = within(listbox()).getByRole('group', { name: 'Tags' });
		expect(
			within(tags)
				.getAllByRole('option')
				.map((option) => option.getAttribute('data-value'))
		).toEqual(['ipv6', 'pci-15b3', 'pci-sub-15b3']);
	});

	it('completes the row chosen with the arrows on Enter', async () => {
		const user = userEvent.setup();
		render(<Host />);

		await user.click(input());
		await user.type(input(), 'medford & pci=');
		await user.keyboard('{ArrowDown}{Enter}');

		expect(input()).toHaveValue('medford & pci: 8086 ');
		expect(screen.queryAllByTestId('meta-filter-chip')).toHaveLength(0);
	});

	it('offers name=value rows as what will be inserted in expression mode', async () => {
		const user = userEvent.setup();
		render(<Host />);

		await user.click(input());
		await user.type(input(), 'medford & pci=8');

		const option = within(listbox()).getByRole('option', {
			name: /pci: 8086/
		});
		await user.click(option);

		expect(input()).toHaveValue('medford & pci: 8086 ');
	});

	it('refuses Enter on an invalid expression and says why', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<Host onChange={onChange} />);

		await user.click(input());
		await user.type(input(), 'device=lab host-01 & ipv6{Enter}');

		expect(screen.getByText(/A value cannot contain a space/)).toBeVisible();
		expect(input()).toHaveValue('device=lab host-01 & ipv6');
		expect(input()).toHaveAttribute('aria-invalid', 'true');
		expect(onChange).not.toHaveBeenCalled();
	});

	it.each([
		['"medford" & ipv6', 'Quotes are not allowed'],
		['pci==15b3 & ipv6', '`==` is not an operator, use `=`'],
		['(medford & ipv6', 'Unbalanced parenthesis: `(` is never closed'],
		['medford & ', 'Expression ends with an operator'],
		['pkt_size > big', '`>` needs a number on the right'],
		['medford ipv6 & arm64', 'A name cannot contain a space']
	])('explains %s', async (text, message) => {
		const user = userEvent.setup();
		render(<Host />);

		await user.click(input());
		await user.type(input(), `${text}{Enter}`);

		expect(
			screen.getByText(new RegExp(message.replace(/[`()]/g, '.')))
		).toBeVisible();
		expect(screen.queryAllByTestId('meta-filter-chip')).toHaveLength(0);
	});

	it('adds an & list of exact pairs the grammar cannot spell as value chips', async () => {
		const user = userEvent.setup();
		render(<Host />);

		await user.click(input());
		await user.type(
			input(),
			// user-event reads `[` as a key name, so it is doubled.
			'tmpl=VAR.tmpl.tst2iut.geneve6.ip4_frag_middle & payload_len=[[0,1200]'
		);

		expect(input()).toHaveAttribute('aria-invalid', 'false');
		expect(screen.getByText(/Enter adds these as 2 value chips/)).toBeVisible();

		await user.keyboard('{Enter}');

		expect(chipTexts()).toEqual([
			{ text: 'tmpl=VAR.tmpl.tst2iut.geneve6.ip4_frag_middle', kind: 'value' },
			{ text: 'payload_len=[0,1200]', kind: 'value' }
		]);
		expect(input()).toHaveValue('');
	});

	it('refuses a value the grammar cannot spell inside a real expression', async () => {
		const user = userEvent.setup();
		render(<Host />);

		await user.click(input());
		await user.type(input(), 'medford | payload_len=[[0,1200]{Enter}');

		expect(
			screen.getByText(
				/`\[` cannot be used in an expression, only in an exact value/
			)
		).toBeVisible();
		expect(screen.queryAllByTestId('meta-filter-chip')).toHaveLength(0);
	});

	it('reads name: value as name=value and shows the chip as the badges are', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<Host onChange={onChange} />);

		await user.click(input());
		await user.type(input(), 'pci: 15b3 | !medford {Enter}');

		expect(onChange).toHaveBeenLastCalledWith([
			expect.objectContaining({
				value: 'pci=15b3 | !medford',
				isExpression: true
			})
		]);
		expect(
			screen.getByRole('button', { name: /Expression: pci: 15b3 \| !medford/ })
		).toBeInTheDocument();
	});

	it('adds an expression chip once', async () => {
		const user = userEvent.setup();
		render(
			<Host initialChips={[{ id: '1', value: '!ipv6', isExpression: true }]} />
		);

		await user.click(input());
		await user.type(input(), '!ipv6 & medford & !ipv6 {Enter}');

		expect(chipTexts()).toEqual([
			{ text: '!ipv6', kind: 'expression' },
			{ text: 'medford', kind: 'expression' }
		]);
		expect(input()).toHaveValue('');
	});

	it('keeps an expression with a top-level | as one chip', async () => {
		const user = userEvent.setup();
		render(<Host />);

		await user.click(input());
		await user.type(input(), 'medford | ipv6 & !arm64');

		expect(screen.getByText(/Enter adds it as one chip/)).toBeVisible();

		await user.keyboard('{Enter}');

		expect(chipTexts()).toEqual([
			{ text: 'medford | ipv6 & !arm64', kind: 'expression' }
		]);
	});

	it('adds one chip per top-level & operand, as a reload reads them back', async () => {
		const user = userEvent.setup();
		render(<Host />);

		await user.click(input());
		await user.type(input(), 'medford & ((pci-15b3 | ipv6) & !arm64)');

		expect(
			screen.getByText(/Enter adds 3 chips, one per & operand/)
		).toBeVisible();

		await user.keyboard('{Enter}');

		expect(chipTexts()).toEqual([
			{ text: 'medford', kind: 'expression' },
			{ text: 'pci-15b3 | ipv6', kind: 'expression' },
			{ text: '!arm64', kind: 'expression' }
		]);
	});

	it('completes a value after name: from the list', async () => {
		const user = userEvent.setup();
		render(<Host />);

		await user.click(input());
		await user.type(input(), 'medford & pci: 80');
		await user.keyboard('{Tab}');

		expect(input()).toHaveValue('medford & pci: 8086 ');
	});

	it('shows an unfinished expression as a hint while the caret is at the end', async () => {
		const user = userEvent.setup();
		render(<Host />);

		await user.click(input());
		await user.type(input(), 'medford &');

		expect(screen.getByText(/Keep typing/)).toBeInTheDocument();
		expect(input()).toHaveAttribute('aria-invalid', 'false');
	});

	it('returns an expression chip to the input for editing on click', async () => {
		const user = userEvent.setup();
		render(
			<Host
				initialChips={[
					{ id: '1', value: 'medford & !ipv6', isExpression: true }
				]}
			/>
		);

		await user.click(
			screen.getByRole('button', { name: /Expression: medford & !ipv6/ })
		);

		expect(screen.queryAllByTestId('meta-filter-chip')).toHaveLength(0);
		expect(input()).toHaveValue('medford & !ipv6');
		expect(screen.getByRole('radio', { name: 'Expression' })).toHaveAttribute(
			'aria-checked',
			'true'
		);
	});

	it('makes Enter create an expression chip from a bare name when Expression is chosen', async () => {
		const user = userEvent.setup();
		render(<Host />);

		await user.click(input());
		await user.type(input(), 'medford');
		await user.click(screen.getByRole('radio', { name: 'Expression' }));
		await user.keyboard('{Enter}');

		expect(chipTexts()).toEqual([{ text: 'medford', kind: 'expression' }]);
	});
});

describe('MetaFilterInput mode', () => {
	it('moves between Value and Expression with the arrow keys', async () => {
		const user = userEvent.setup();
		render(<Host />);
		const radio = (name: string) => screen.getByRole('radio', { name });

		expect(radio('Value')).toHaveAttribute('tabindex', '0');
		expect(radio('Expression')).toHaveAttribute('tabindex', '-1');

		radio('Value').focus();
		await user.keyboard('{ArrowRight}');

		expect(radio('Expression')).toHaveAttribute('aria-checked', 'true');
		expect(radio('Expression')).toHaveFocus();
		expect(radio('Expression')).toHaveAttribute('tabindex', '0');

		await user.keyboard('{ArrowLeft}');

		expect(radio('Value')).toHaveAttribute('aria-checked', 'true');
		expect(radio('Value')).toHaveFocus();
	});

	it('stays in Expression mode after a chip is added until Value is chosen', async () => {
		const user = userEvent.setup();
		render(<Host />);

		await user.click(input());
		await user.type(input(), 'medford | ipv6 {Enter}');
		await user.type(input(), 'arm64 {Enter}');

		expect(chipTexts()).toEqual([
			{ text: 'medford | ipv6', kind: 'expression' },
			{ text: 'arm64', kind: 'expression' }
		]);

		await user.click(screen.getByRole('radio', { name: 'Value' }));
		await user.type(input(), 'ipv6{Enter}');

		expect(chipTexts()).toContainEqual({ text: 'ipv6', kind: 'value' });
	});
});

describe('MetaFilterInput help', () => {
	it('opens the syntax help from the label', async () => {
		const user = userEvent.setup();
		render(<Host />);

		await user.click(
			screen.getByRole('button', { name: 'Expression syntax help' })
		);

		const help = screen.getByRole('dialog', { name: 'Expression syntax' });
		expect(within(help).getByText('name!=value')).toBeInTheDocument();
		expect(within(help).getByText(/compare as/)).toBeInTheDocument();
	});
});

describe('MetaFilterInput toolbar', () => {
	it('opens on focus and folds back on Esc', async () => {
		const user = userEvent.setup();
		render(
			<Host
				variant="toolbar"
				hideLabel
				initialChips={[
					{ id: 'a', value: 'medford', isExpression: false },
					{ id: 'b', value: 'pci=15b3', isExpression: false }
				]}
			/>
		);
		const field = () => input().closest('[data-mode]');

		expect(field()).not.toHaveAttribute('data-expanded');

		await user.click(input());
		expect(field()).toHaveAttribute('data-expanded');

		// The first Esc closes the suggestions, the next one folds the panel.
		await user.keyboard('{Escape}');
		await user.keyboard('{Escape}');
		expect(input()).not.toHaveFocus();
		expect(field()).not.toHaveAttribute('data-expanded');
	});
});

describe('MetaFilterInput toolbar help', () => {
	it('opens the syntax help beside the mode switch', async () => {
		const user = userEvent.setup();
		render(<Host variant="toolbar" hideLabel />);

		await user.click(
			screen.getByRole('button', { name: 'Expression syntax help' })
		);

		expect(
			screen.getByRole('heading', { name: 'Writing expressions' })
		).toBeVisible();
	});
});

describe('MetaFilterInput in a form', () => {
	function renderInForm() {
		const onChange = vi.fn();
		const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
		render(
			<form onSubmit={onSubmit}>
				<Host onChange={onChange} />
				<button type="submit">Submit</button>
			</form>
		);
		return { onChange, onSubmit };
	}

	it('adds the typed expression before the form submits', async () => {
		const user = userEvent.setup();
		const { onChange, onSubmit } = renderInForm();

		await user.click(input());
		await user.type(input(), 'medford & !ipv6');
		await user.click(screen.getByRole('button', { name: 'Submit' }));

		expect(onChange).toHaveBeenLastCalledWith([
			expect.objectContaining({ value: 'medford', isExpression: true }),
			expect.objectContaining({ value: '!ipv6', isExpression: true })
		]);
		expect(onSubmit).toHaveBeenCalledTimes(1);
	});

	it('does not add the query of a pick when the form submits', async () => {
		const user = userEvent.setup();
		const { onChange, onSubmit } = renderInForm();

		await user.click(input());
		await user.type(input(), '15b3');
		await user.click(
			within(listbox()).getByRole('option', { name: /pci: 15b3/ })
		);
		await user.click(screen.getByRole('button', { name: 'Submit' }));

		expect(onChange).toHaveBeenLastCalledWith([
			expect.objectContaining({ value: 'pci=15b3', isExpression: false })
		]);
		expect(onSubmit).toHaveBeenCalledTimes(1);
		expect(chipTexts()).toEqual([{ text: 'pci=15b3', kind: 'value' }]);
	});

	it('stops the submit on an expression that does not parse', async () => {
		const user = userEvent.setup();
		const { onChange, onSubmit } = renderInForm();

		await user.click(input());
		await user.type(input(), 'medford &');
		await user.click(screen.getByRole('button', { name: 'Submit' }));

		expect(onSubmit).not.toHaveBeenCalled();
		expect(onChange).not.toHaveBeenCalled();
		expect(input()).toHaveFocus();
		expect(input()).toHaveValue('medford &');
	});
});

describe('MetaFilterInput with value-only groups', () => {
	const SCOPED = [
		{ label: 'Important', items: ['conclusion=interrupted'], kind: 'tag' },
		{ label: 'Metadata', items: ['nightly', 'branch=main'], valueOnly: true },
		{ label: 'Tags', items: ['medford', 'ipv6'], kind: 'tag' }
	];

	it('offers value-only metas as values, not in expressions', async () => {
		const user = userEvent.setup();
		render(<Host suggestions={SCOPED} />);

		await user.click(input());
		expect(
			within(listbox()).getByRole('group', { name: 'Metadata' })
		).toBeInTheDocument();

		await user.type(input(), '!');
		expect(
			within(listbox()).queryByRole('group', { name: 'Metadata' })
		).toBeNull();
		expect(screen.getByText(/Expressions match tags only/)).toBeInTheDocument();
	});

	it('refuses an expression over a value-only meta and adds & lists of them as values', async () => {
		const user = userEvent.setup();
		render(<Host suggestions={SCOPED} />);

		await user.click(input());
		await user.type(input(), 'branch=main & medford');

		expect(
			screen.getByText(/`branch: main` can only be a value chip here/)
		).toBeVisible();
		expect(screen.getByText(/Enter adds these as 2 value chips/)).toBeVisible();

		await user.keyboard('{Enter}');

		expect(chipTexts()).toEqual([
			{ text: 'branch=main', kind: 'value' },
			{ text: 'medford', kind: 'value' }
		]);

		await user.type(input(), 'nightly | ipv6{Enter}');

		expect(input()).toHaveAttribute('aria-invalid', 'true');
		expect(
			screen.getByText(/`nightly` can only be a value chip here/)
		).toBeVisible();
		expect(chipTexts()).toHaveLength(2);
	});
});

describe('MetaFilterInput with metas of several kinds', () => {
	const KINDED = [
		{ label: 'Important', items: ['conclusion=interrupted'], kind: 'tag' },
		{ label: 'Labels', items: ['CFG=basic', 'nightly'], kind: 'label' },
		{ label: 'Branches', items: ['TS_BRANCH=main'], kind: 'branch' },
		{ label: 'Tags', items: ['medford', 'ipv6'], kind: 'tag' }
	];

	it('gives an expression chip the kind of the metas it names', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<Host suggestions={KINDED} onChange={onChange} />);

		await user.click(input());
		// Bracketed: a top-level `|` would make the whole text one expression.
		await user.type(input(), 'CFG: basic & (medford | ipv6) & !no-such');

		expect(
			screen.getByText(
				/An expression searches one kind of meta: tag, label, branch/
			)
		).toBeInTheDocument();

		await user.keyboard('{Enter}');

		expect(onChange).toHaveBeenLastCalledWith([
			expect.objectContaining({ value: 'CFG=basic', kind: 'label' }),
			expect.objectContaining({ value: 'medford | ipv6', kind: 'tag' }),
			expect.not.objectContaining({ kind: expect.anything() })
		]);
		const chips = screen.getAllByTestId('meta-filter-chip');
		expect(chips[0]).toHaveAttribute('data-expression-kind', 'label');
		expect(chips[0]).toHaveTextContent(/label/);
		expect(chips[2]).not.toHaveAttribute('data-expression-kind');
		expect(
			screen.getByRole('button', { name: /Label expression: CFG: basic/ })
		).toBeInTheDocument();
	});

	it('refuses an expression that names metas of two kinds', async () => {
		const user = userEvent.setup();
		render(<Host suggestions={KINDED} />);

		await user.click(input());
		await user.type(input(), 'nightly | medford{Enter}');

		expect(
			screen.getByText(/`nightly` is a label and `medford` is a tag/)
		).toBeVisible();
		expect(input()).toHaveAttribute('aria-invalid', 'true');
		expect(screen.queryAllByTestId('meta-filter-chip')).toHaveLength(0);
	});

	it('waits for the lists before routing a name they do not hold yet', async () => {
		const user = userEvent.setup();
		render(<Host suggestions={KINDED} suggestionsLoading />);

		await user.click(input());
		await user.type(input(), 'nowhere & medford{Enter}');

		expect(screen.getByText(/still loading/)).toBeVisible();
		expect(screen.queryAllByTestId('meta-filter-chip')).toHaveLength(0);
	});
});

describe('MetaFilterInput without custom values', () => {
	it('adds the first match of what is typed on Enter', async () => {
		const user = userEvent.setup();
		render(<Host allowCustomValues={false} />);

		await user.click(input());
		await user.type(input(), 'medf{Enter}');

		expect(chipTexts()).toEqual([{ text: 'medford', kind: 'value' }]);
		expect(input()).toHaveValue('');
	});

	it('refuses a value nothing matches and says so', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<Host allowCustomValues={false} onChange={onChange} />);

		await user.click(input());
		await user.type(input(), 'nowhere{Enter}');

		expect(onChange).not.toHaveBeenCalled();
		expect(input()).toHaveValue('nowhere');
		expect(screen.getByText(/No tags match “nowhere”/)).toBeVisible();
	});

	it('stops the submit on a value nothing matches', async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
		render(
			<form onSubmit={onSubmit}>
				<Host allowCustomValues={false} />
				<button type="submit">Submit</button>
			</form>
		);

		await user.click(input());
		await user.type(input(), 'nowhere');
		await user.click(screen.getByRole('button', { name: 'Submit' }));

		expect(onSubmit).not.toHaveBeenCalled();
		expect(input()).toHaveValue('nowhere');
	});

	it('still takes a free expression', async () => {
		const user = userEvent.setup();
		render(<Host allowCustomValues={false} />);

		await user.click(input());
		await user.type(input(), 'nowhere & !ipv6 {Enter}');

		expect(chipTexts()).toEqual([
			{ text: 'nowhere', kind: 'expression' },
			{ text: '!ipv6', kind: 'expression' }
		]);
	});
});
