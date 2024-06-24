/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { useGetRunReportConfigsQuery } from '@/services/bublik-api';
import {
	ButtonTw,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Icon,
	Tooltip
} from '@/shared/tailwind-ui';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface RunReportConfigsContainerProps {
	runId: string | number;
}

function RunReportConfigsContainer({ runId }: RunReportConfigsContainerProps) {
	const { isLoading, data, isError } = useGetRunReportConfigsQuery(runId);
	const [open, setOpen] = useState(false);

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<ButtonTw
					variant="secondary"
					size="xss"
					disabled={isError || !data?.run_report_configs.length}
					state={
						isLoading
							? 'loading'
							: isError || !data?.run_report_configs.length
							? 'disabled'
							: open
							? 'active'
							: 'default'
					}
				>
					{isLoading ? (
						<Icon
							name="ProgressIndicator"
							size={20}
							className="mr-1.5 animate-spin"
						/>
					) : (
						<Icon name="LineChartSingle" size={20} className="mr-2" />
					)}
					Reports
				</ButtonTw>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				{data ? (
					<>
						<DropdownMenuLabel>Reports</DropdownMenuLabel>
						<DropdownMenuSeparator />
						{data.run_report_configs.map((config) => (
							<Tooltip
								key={config.id}
								content={config.description}
								side="right"
								sideOffset={8}
							>
								<DropdownMenuItem asChild className="pl-2 gap-4">
									<Link to={`/runs/${runId}/report/?config=${config.id}`}>
										{config.name}
										<Icon
											name="BoxArrowRight"
											className="text-primary ml-auto w-4 h-4"
										/>
									</Link>
								</DropdownMenuItem>
							</Tooltip>
						))}
						{data.invalid_report_config_files.length ? (
							<>
								<DropdownMenuSeparator />
								<DropdownMenuLabel className="flex justify-between place-items-center">
									<span>Invalid</span>
									<Icon
										name="TriangleExclamationMark"
										className="text-text-unexpected w-5 h-5"
									/>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								{data.invalid_report_config_files.map((config) => (
									<Tooltip
										key={config.file}
										content={config.reason}
										side="right"
										sideOffset={8}
									>
										<DropdownMenuItem className="pl-2">
											<span>{config.file}</span>
										</DropdownMenuItem>
									</Tooltip>
								))}
							</>
						) : null}
					</>
				) : null}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export { RunReportConfigsContainer };
