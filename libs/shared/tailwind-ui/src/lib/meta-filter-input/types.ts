/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

/**
 * One chip of a meta filter input: an exact value (`name` or `name=value`,
 * in the submit form) or a boolean expression over such names. The kind is
 * decided when the chip is made and kept, never re-derived from the text.
 */
export interface MetaFilterChip {
	id: string;
	value: string;
	isExpression: boolean;
	/**
	 * An expression chip: the kind of the metas it names, from the suggestion
	 * group they were offered in (`tag`, `label`, …), so the form can send it
	 * under that kind's parameter. Unset when no atom is a listed meta.
	 */
	kind?: string;
}

/**
 * A group of values the input offers, in the submit form (`name=value`), as
 * the runs page groups its metas: Important, Metadata, Tags.
 */
export interface MetaFilterSuggestionGroup {
	label: string;
	items: readonly string[];
	/**
	 * The kind of the group's metas, named on each row in expression mode:
	 * `tag`, `label`, … An expression chip takes the kind of the metas it
	 * names; one naming two kinds is refused, as an expression parameter
	 * searches one kind.
	 */
	kind?: string;
	/**
	 * Offered as value chips only: the field's expression parameter does not
	 * search these metas, so an expression naming one would match nothing.
	 * They are left out of the list in expression mode and refused in an
	 * expression, with the way out: a value chip.
	 */
	valueOnly?: boolean;
	/** The chip colour of the group's values, in the list and as chips. */
	className?: string;
}
