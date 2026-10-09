/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
export type BadgeItem = {
	id: string;
	value: string;
};

/**
 * The classes of a field's badges and of its suggestions' chips, one for all
 * or one per value (`name=value`), so a field can colour its values as the
 * rest of the UI colours that kind of value. Unset, a badge is `bg-badge-0`.
 */
export type BadgeClassName = string | ((value: string) => string | undefined);

export const resolveBadgeClassName = (
	className: BadgeClassName | undefined,
	value: string
): string | undefined =>
	typeof className === 'function' ? className(value) : className;
