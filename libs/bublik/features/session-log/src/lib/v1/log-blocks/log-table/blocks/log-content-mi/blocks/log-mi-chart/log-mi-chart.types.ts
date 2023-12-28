/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
export type ResultDescriptionValue = {
	units: string;
	value: number;
	multiplier: string;
};

export type ResultDescriptionItem = {
	parameterName: string;
	values: ResultDescriptionValue[];
};
