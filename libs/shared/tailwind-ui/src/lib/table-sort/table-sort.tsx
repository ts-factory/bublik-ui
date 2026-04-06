/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { SortDirection } from '@tanstack/react-table';

import { SortArrow } from '@/icons';

const IconUp = (
	<SortArrow className="shrink-0 size-4 translate-y-0.5 rotate-180" />
);
const IconDown = <SortArrow className="shrink-0 size-4 -translate-y-px" />;

const isReactTableV8SortProps = (
	props: Record<string, unknown>
): props is ReactTableV8Props => 'sortDescription' in props;

type ReactTableV7Props = { isSorted: boolean; isSortedDesc?: boolean };
type ReactTableV8Props = { sortDescription: boolean | SortDirection };

export type TableSortProps = ReactTableV7Props | ReactTableV8Props;

export const TableSort = (props: TableSortProps) => {
	if (isReactTableV8SortProps(props)) {
		if (props.sortDescription === 'asc') return IconUp;

		if (props.sortDescription === 'desc') return IconDown;

		return (
			<div className="inline-flex items-center" style={{ opacity: 0 }}>
				{IconUp}
			</div>
		);
	}

	if (!props.isSorted) return null;

	if (props.isSortedDesc) return <div className="ml-1">{IconDown}</div>;

	return <div className="ml-1">{IconUp}</div>;
};
