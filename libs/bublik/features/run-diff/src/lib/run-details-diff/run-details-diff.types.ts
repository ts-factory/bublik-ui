/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
export type MetaDiff = {
	label: string;
	left: MetadataValue[];
	right: MetadataValue[];
};

export type MetadataValue = {
	value: string;
	url?: string;
	className?: string;
};
