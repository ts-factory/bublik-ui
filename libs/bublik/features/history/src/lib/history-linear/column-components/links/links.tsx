/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	HistoryDataLinear,
	LogPageMode,
	MeasurementsMode
} from '@/shared/types';
import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { ButtonTw, Icon, SplitButton, Tooltip } from '@/shared/tailwind-ui';
import { LogPreviewContainer } from '@/bublik/features/log-preview-drawer';
import { LinkWithProject } from '@/bublik/features/projects';
import { parseSearch } from '@/router';

import { useHistorySearch } from '../../../hooks';
import { getHistoryShortcuts } from './links.utils';

export interface LinksProps {
	row: HistoryDataLinear;
}

export const Links = ({ row }: LinksProps) => {
	const shortcuts = useHistorySearch((search) =>
		getHistoryShortcuts(row, search)
	);

	const handleLinkClick = (action: string) => {
		trackEvent(analyticsEventNames.historyLinkClick, {
			action
		});
	};

	return (
		<div className="flex flex-col items-start gap-1">
			<ButtonTw asChild size="xss" variant="secondary">
				<LinkWithProject
					to="/log/$runId"
					params={{ runId: row.run_id }}
					search={{
						focusId: row.result_id || undefined,
						mode: LogPageMode.InfoAndLog
					}}
					onClick={() => handleLinkClick('log')}
				>
					<Icon name="BoxArrowRight" className="mr-1.5" />
					Log
				</LinkWithProject>
			</ButtonTw>
			<ButtonTw asChild size="xss" variant="secondary">
				<LinkWithProject
					to="/runs/$runId"
					params={{ runId: row.run_id }}
					search={{ targetIterationId: row.result_id || undefined }}
					onClick={() => handleLinkClick('run')}
				>
					<Icon name="BoxArrowRight" className="mr-1.5" />
					Run
				</LinkWithProject>
			</ButtonTw>
			{row.report_config_id != null && (
				<ButtonTw asChild size="xss" variant="secondary">
					<LinkWithProject
						to="/runs/$runId/report"
						params={{ runId: row.run_id }}
						search={{ config: row.report_config_id }}
						onClick={() => handleLinkClick('report')}
					>
						<Icon name="BoxArrowRight" className="mr-1.5" />
						Report
					</LinkWithProject>
				</ButtonTw>
			)}
			<SplitButton.Root variant="secondary" size="xss">
				<SplitButton.Button asChild>
					<LinkWithProject
						to="/history"
						search={parseSearch(shortcuts.historyQuery)}
						onClick={() => handleLinkClick('history_default')}
					>
						<Icon
							name="BoxArrowRight"
							size={20}
							className="grid place-items-center mr-1"
						/>
						<span>History</span>
					</LinkWithProject>
				</SplitButton.Button>
				<SplitButton.Separator orientation="vertical" className="h-5" />
				<SplitButton.Trigger>
					<Icon name="ChevronDown" size={14} />
				</SplitButton.Trigger>
				<SplitButton.Content align="start">
					<SplitButton.Label>Shortcuts</SplitButton.Label>
					<SplitButton.Separator className="my-1" />
					<Tooltip
						side="right"
						sideOffset={12}
						content="All unexpected with (meta, tags, parameters)"
					>
						<SplitButton.Item asChild>
							<LinkWithProject
								to="/history"
								search={parseSearch(shortcuts.allUnexpected)}
								target="_blank"
								onClick={() => handleLinkClick('history_all_unexpected')}
							>
								<Icon name="ExternalLink" size={16} className="text-primary" />
								<span>All Unexpected</span>
							</LinkWithProject>
						</SplitButton.Item>
					</Tooltip>

					<Tooltip
						side="right"
						sideOffset={12}
						content="All unexpected with (meta, tags, parameters, verdicts)"
					>
						<SplitButton.Item asChild>
							<LinkWithProject
								to="/history"
								search={parseSearch(shortcuts.similarUnexpected)}
								target="_blank"
								onClick={() => handleLinkClick('history_similar_unexpected')}
							>
								<Icon name="ExternalLink" size={16} className="text-primary" />
								<span>Similar Unexpected</span>
							</LinkWithProject>
						</SplitButton.Item>
					</Tooltip>
				</SplitButton.Content>
			</SplitButton.Root>
			{row.has_measurements && (
				<ButtonTw asChild size="xss" variant="secondary">
					<LinkWithProject
						to="/runs/$runId/results/$resultId/measurements"
						params={{ runId: row.run_id, resultId: row.result_id }}
						search={{ mode: MeasurementsMode.Default }}
						onClick={() => handleLinkClick('result')}
					>
						<Icon name="BoxArrowRight" className="mr-1.5" />
						Result
					</LinkWithProject>
				</ButtonTw>
			)}
			<LogPreviewContainer
				runId={row.run_id}
				resultId={row.result_id}
				measurementId={row.has_measurements ? row.result_id : undefined}
			>
				<ButtonTw
					size="xss"
					variant="secondary"
					className="justify-start w-fit"
					onClick={() => handleLinkClick('preview')}
				>
					<Icon name="ExpandSelection" className="mr-1.5" size={20} />
					<span>Preview</span>
				</ButtonTw>
			</LogPreviewContainer>
		</div>
	);
};
