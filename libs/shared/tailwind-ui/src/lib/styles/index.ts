/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { cva } from '../utils';

export const infoListItemStyles = cva({
	base: 'text-[0.625rem] font-medium leading-[1.125rem] rounded inline-flex py-0.5 px-2 border border-transparent',
	variants: { isLink: { true: 'hover:underline' } }
});
