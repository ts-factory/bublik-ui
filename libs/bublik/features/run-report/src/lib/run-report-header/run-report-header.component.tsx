/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { Link } from 'react-router-dom';
import { BooleanParam, useQueryParam, withDefault } from 'use-query-params';

import { routes } from '@/router';
import { RunDetailsAPIResponse } from '@/shared/types';
import { CopyShortUrlButtonContainer } from '@/bublik/features/copy-url';
import {
	Badge,
	ButtonTw,
	CardHeader,
	Icon,
	cn,
	RunModeToggle
} from '@/shared/tailwind-ui';
import { RunDetails } from '@/bublik/features/run-details';
import { LinkToSourceContainer } from '@/bublik/features/link-to-source';

const IsOpenParam = withDefault(BooleanParam, true);

interface RunReportHeaderProps {
	label: string;
	runId: number;
	details: RunDetailsAPIResponse;
}

function RunReportHeader(props: RunReportHeaderProps) {
	const { label, runId, details } = props;
	const [isModeFull, setIsModeFull] = useQueryParam('isFullMode', IsOpenParam);

	return (
		<div className="flex flex-col bg-white rounded">
			<CardHeader
				label={
					<div className="flex items-center gap-2">
						<span className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem]">
							{label}
						</span>
					</div>
				}
			>
				<div className="flex items-center gap-2">
					<RunModeToggle
						isFullMode={isModeFull}
						onToggleClick={() => setIsModeFull(!isModeFull)}
					/>
					<LinkToSourceContainer runId={runId.toString()} />
					<ButtonTw asChild variant="secondary" size="xss">
						<Link to={routes.run({ runId })}>
							<Icon name="BoxArrowRight" className="mr-1.5" />
							Run
						</Link>
					</ButtonTw>
					<ButtonTw asChild variant="secondary" size="xss">
						<Link to={routes.log({ runId })}>
							<Icon name="BoxArrowRight" className="mr-1.5" />
							Log
						</Link>
					</ButtonTw>
					<CopyShortUrlButtonContainer />
				</div>
			</CardHeader>
			<div className="flex flex-col gap-2">
				<RunDetails
					isFullMode={isModeFull}
					runId={runId}
					mainPackage={details.main_package}
					start={details.start}
					finish={details.finish}
					duration={details.duration}
					isCompromised={details.is_compromised}
					importantTags={details.important_tags}
					relevantTags={details.relevant_tags}
					branches={details.branches}
					labels={details.labels}
					revisions={details.revisions}
					specialCategories={details.special_categories}
					runStatus={details.conclusion}
					status={details.status}
					statusByNok={details.status_by_nok}
				/>
			</div>
		</div>
	);
}

type Item = {
	name: string;
	value: string;
	url?: string;
	className?: string;
};

interface ListProps {
	label: string;
	items: Item[];
}

function List(props: ListProps) {
	return (
		<div className="grid items-center grid-cols-[minmax(80px,_max-content)_48px_1fr]">
			<span className="text-text-menu text-[0.6875rem] font-medium leading-[0.875rem] col-end-2 col-start-1">
				{props.label}
			</span>
			<ul className="col-start-3 flex items-center gap-2 flex-wrap">
				{props.items.map((item) => {
					if (item.url) {
						return (
							<a
								key={`${item.name}_${item.value}`}
								href={item.url}
								target="_blank"
								rel="noreferrer"
							>
								<Badge className={cn(item.className, 'hover:underline')}>
									<span className="text-[0.625rem] font-medium leading-[1.125rem]">
										{item.name}: {item.value}
									</span>
								</Badge>
							</a>
						);
					}

					return (
						<Badge
							key={`${item.name}_${item.value}`}
							className={item.className}
						>
							<span className="text-[0.625rem] font-medium leading-[1.125rem]">
								{item.name}: {item.value}
							</span>
						</Badge>
					);
				})}
			</ul>
		</div>
	);
}

export { RunReportHeader, List };
