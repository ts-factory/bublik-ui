/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ReactNode } from 'react';

import { Icon, cn } from '@/shared/tailwind-ui';

import { JoinedToggleGroup } from '../joined-toggle-group';
import { ResultViewMode } from '../result-matrix/result-view.hooks';

export interface ResultViewToggleProps {
	value: ResultViewMode;
	onChange: (value: ResultViewMode) => void;
	matrixDisabled?: boolean;
}

/** List / Matrix switcher for a test's iterations. */
export function ResultViewToggle(props: ResultViewToggleProps) {
	const { value, onChange, matrixDisabled = false } = props;

	return (
		<JoinedToggleGroup<ResultViewMode>
			aria-label="Iteration view"
			value={value}
			onChange={onChange}
			items={[
				{
					value: 'list',
					tooltip: 'Show iterations as a list',
					label: (
						<>
							<Icon name="PaperListText" size={20} className="mr-1.5" />
							List
						</>
					)
				},
				{
					value: 'matrix',
					disabled: matrixDisabled,
					tooltip: matrixDisabled
						? 'Matrix needs at least two varying parameters'
						: 'Cross two parameters in a matrix',
					label: (
						<>
							<Icon name="Category" size={20} className="mr-1.5" />
							Matrix
						</>
					)
				}
			]}
		/>
	);
}

export interface ResultViewBarProps {
	left?: ReactNode;
	right?: ReactNode;
	className?: string;
}

/** Header line shared by the List and Matrix views of a test's iterations. */
export function ResultViewBar(props: ResultViewBarProps) {
	const { left, right, className } = props;

	return (
		<div
			className={cn(
				'flex items-center justify-between gap-3 px-4 py-1 min-h-9 bg-white border-b border-border-primary',
				className
			)}
		>
			<div className="flex items-center gap-3 min-w-0 flex-wrap">{left}</div>
			<div className="flex items-center gap-2 flex-wrap justify-end">
				{right}
			</div>
		</div>
	);
}
