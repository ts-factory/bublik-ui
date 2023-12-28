/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
export interface Pagination {
	previous: string | null;
	next: string | null;
	count: number;
}
