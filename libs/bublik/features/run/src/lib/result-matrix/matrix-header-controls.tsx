/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	ButtonTw,
	Checkbox,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
	Icon,
	Tooltip
} from '@/shared/tailwind-ui';

import { JoinedToggleGroup } from '../joined-toggle-group';
import { MatrixCellMode, MatrixConfigLayout } from './result-view.hooks';

export interface MatrixHeaderControlsProps {
	rowId: string;
	mode: MatrixCellMode;
	onModeChange: (mode: MatrixCellMode) => void;
	margins: boolean;
	onMarginsChange: (margins: boolean) => void;
	layout: MatrixConfigLayout;
	onLayoutChange: (layout: MatrixConfigLayout) => void;
}

/** Right-hand side of the shared view bar while the matrix is shown. */
export function MatrixHeaderControls(props: MatrixHeaderControlsProps) {
	const {
		rowId,
		mode,
		onModeChange,
		margins,
		onMarginsChange,
		layout,
		onLayoutChange
	} = props;
	const marginsId = `matrix-margins-${rowId}`;

	return (
		<>
			<span className="text-[0.6875rem] font-semibold leading-[0.875rem] uppercase tracking-wide text-text-menu">
				Cell
			</span>
			<JoinedToggleGroup<MatrixCellMode>
				aria-label="Cell mode"
				value={mode}
				onChange={onModeChange}
				items={[
					{
						value: 'coverage',
						label: 'Coverage',
						tooltip: 'Colour cells by how many iterations they hold'
					},
					{
						value: 'result',
						label: 'Result',
						tooltip: 'Colour cells by expected / unexpected result'
					}
				]}
			/>
			<Checkbox
				id={marginsId}
				label="Margins"
				checked={margins}
				onCheckedChange={(checked) => onMarginsChange(checked === true)}
				className="ml-1"
			/>
			<DropdownMenu>
				<Tooltip content="Debug: switch the configuration layout">
					<DropdownMenuTrigger asChild>
						<ButtonTw
							variant="outline-secondary"
							size="xss"
							aria-label="Debug layout menu"
						>
							<Icon name="Gear" size={16} className="mr-1.5" />
							Debug
						</ButtonTw>
					</DropdownMenuTrigger>
				</Tooltip>
				<DropdownMenuContent align="end">
					<DropdownMenuLabel className="text-[0.625rem] uppercase tracking-wide text-text-menu">
						Config layout
					</DropdownMenuLabel>
					<DropdownMenuRadioGroup
						value={layout}
						onValueChange={(value) =>
							onLayoutChange(value as MatrixConfigLayout)
						}
					>
						<DropdownMenuRadioItem value="rail">
							Left rail
						</DropdownMenuRadioItem>
						<DropdownMenuRadioItem value="toolbar">
							Toolbar
						</DropdownMenuRadioItem>
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</>
	);
}
