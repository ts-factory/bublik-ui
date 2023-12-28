/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
export type TagModel<ExtendProps = object> = {
	id: string;
	/** Main value */
	value: string;
	/* Displayed label */
	label: string;
	/** Is tag selected or not */
	isSelected?: boolean;
	/** Additional classname */
	className?: string;
} & ExtendProps;
