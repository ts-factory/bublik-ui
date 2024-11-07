/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, useState } from 'react';

import {
	ButtonTw,
	Icon,
	Popover,
	PopoverContent,
	PopoverTrigger,
	cn
} from '@/shared/tailwind-ui';

import { useExportChart } from '../hooks';
import { SingleMeasurementChart } from '@/services/bublik-api';

type AllowedExportExtensions = 'xlsx' | 'csv';

export type ExportExtensions = `.${AllowedExportExtensions}`;

export interface ExportChartListProps {
	extensions: ExportExtensions[];
	onSaveAsClick: (fileExtension: ExportExtensions) => void;
}

export const ExportChartList: FC<ExportChartListProps> = ({
	extensions,
	onSaveAsClick
}) => {
	const handleSaveAsClick = (fileExtension: ExportExtensions) => () => {
		onSaveAsClick(fileExtension);
	};

	return (
		<div className="p-2 bg-white rounded-lg shadow-popover">
			<ul className="flex flex-col gap-2 min-w-[140px]">
				{extensions.map((extension) => (
					<li className="w-full" key={extension}>
						<button
							className="w-full py-2.5 px-4 rounded-md transition-all text-text-primary text-start hover:text-primary hover:bg-primary-wash"
							onClick={handleSaveAsClick(extension)}
						>
							<span className="text-[0.6875rem] font-medium leading-[0.875rem]">
								Export as {extension}
							</span>
						</button>
					</li>
				))}
			</ul>
		</div>
	);
};

export interface ExportChartProps {
	plots?: SingleMeasurementChart[];
	isLoading?: boolean;
	disabled?: boolean;
}

export const ExportChart = ({
	plots,
	isLoading,
	disabled
}: ExportChartProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const { handleExportClick } = useExportChart({ plots });
	const isDisabled = !plots?.length || disabled;

	return (
		<Popover onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<ButtonTw
					variant="secondary"
					size="xss"
					state={isLoading ? 'loading' : isOpen ? 'active' : undefined}
					disabled={isDisabled}
				>
					{isLoading && !isDisabled ? (
						<Icon
							name="ProgressIndicator"
							size={20}
							className={cn('mr-1.5', isLoading && 'animate-spin')}
						/>
					) : (
						<Icon name="Import" size={20} className="mr-1.5" />
					)}
					Export
				</ButtonTw>
			</PopoverTrigger>
			<PopoverContent sideOffset={4}>
				<ExportChartList
					onSaveAsClick={handleExportClick}
					extensions={['.xlsx', '.csv']}
				/>
			</PopoverContent>
		</Popover>
	);
};
