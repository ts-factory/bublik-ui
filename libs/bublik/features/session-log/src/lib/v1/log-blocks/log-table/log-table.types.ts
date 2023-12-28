/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
export type FilterValue = { entityName: string; userName: string };

export type LogTableFilterValue = {
	levels: string[];
	filters: string[];
};

export type FilterButton = {
	label: string;
	filters: FilterValue[];
};
