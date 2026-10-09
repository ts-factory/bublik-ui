/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { IconProps } from '@/shared/tailwind-ui';

export type IconName = IconProps['name'];

/**
 * Compile-time exhaustiveness for an order tuple: the tuple has to name every
 * member of the union or the call does not typecheck.
 */
export const orderOf =
	<U extends string>() =>
	<T extends readonly U[]>(
		tuple: T & (Exclude<U, T[number]> extends never ? T : never)
	): readonly U[] =>
		tuple;

export const STRIPE_GREEN = 'bg-bg-ok text-white';
export const STRIPE_ORANGE = 'bg-bg-warning text-white';
export const STRIPE_RED = 'bg-bg-error text-white';
export const STRIPE_VIOLET = 'bg-bg-triage text-white';
export const STRIPE_GREY = 'bg-bg-compromised text-white';
