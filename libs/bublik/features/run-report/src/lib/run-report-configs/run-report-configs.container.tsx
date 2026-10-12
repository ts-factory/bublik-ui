/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import {
	forwardRef,
	useState,
	type AnchorHTMLAttributes,
	type Ref
} from 'react';

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
	Separator,
	Tooltip
} from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';

interface RunReportConfigLinkProps
	extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
	runId: number;
	configId: number;
}

/**
 * The run's report page for one config (`/runs/$runId/report?config=`); the
 * menu item's props and ref reach the anchor.
 */
const RunReportConfigLink = forwardRef(function RunReportConfigLink(
	{ runId, configId, ...props }: RunReportConfigLinkProps,
	ref: Ref<HTMLAnchorElement>
) {
	return (
		<LinkWithProject
			ref={ref}
			{...props}
			to="/runs/$runId/report"
			params={{ runId }}
			search={{ config: configId }}
		/>
	);
});

interface RunReportConfigsContainerProps {
	runId: number;
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
					<span>Reports</span>
					<Separator className="mx-1.5" orientation="vertical" />
					<Icon name="ArrowShortTop" size={18} className="rotate-180" />
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
									<RunReportConfigLink runId={runId} configId={config.id}>
										{config.name}
										<Icon
											name="BoxArrowRight"
											className="text-primary ml-auto w-4 h-4"
										/>
									</RunReportConfigLink>
								</DropdownMenuItem>
							</Tooltip>
						))}
					</>
				) : null}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export { RunReportConfigLink, RunReportConfigsContainer };
