/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';
import { SortDirection } from '@tanstack/react-table';

const IconUp = (
	<svg
		width="6"
		height="8"
		viewBox="0 0 6 8"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path d="M3 0L5.59808 3H0.401924L3 0Z" fill="#454c58" />
	</svg>
);

const IconDown = (
	<svg
		width="6"
		height="8"
		viewBox="0 0 6 8"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path d="M3 8L5.59808 5H0.401924L3 8Z" fill="#454c58" />
	</svg>
);

const isReactTableV8SortProps = (
	props: Record<string, unknown>
): props is ReactTableV8Props => 'sortDescription' in props;

type ReactTableV7Props = { isSorted: boolean; isSortedDesc?: boolean };
type ReactTableV8Props = { sortDescription: boolean | SortDirection };

export type TableSortProps = ReactTableV7Props | ReactTableV8Props;

export const TableSort: FC<TableSortProps> = (props) => {
	if (isReactTableV8SortProps(props)) {
		if (props.sortDescription === 'asc') return IconUp;

		if (props.sortDescription === 'desc') return IconDown;

		return (
			<div style={{ opacity: props.sortDescription ? 1 : 0 }}>{IconUp}</div>
		);
	}

	if (!props.isSorted) return null;

	if (props.isSortedDesc) return <div className="ml-1">{IconDown}</div>;

	return <div className="ml-1">{IconUp}</div>;
};
