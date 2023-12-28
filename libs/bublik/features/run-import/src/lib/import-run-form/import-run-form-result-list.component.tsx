/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { config } from '@/bublik/config';
import { ImportEventResponse } from '@/shared/types';
import { DialogDescription, DialogTitle, Icon } from '@/shared/tailwind-ui';

import { statusBadgeStyles } from '../import-events-table/import-event-table.columns';

export interface RunImportResultProps {
	results: ImportEventResponse[];
}

export const RunImportResult = (props: RunImportResultProps) => {
	return (
		<div>
			<DialogTitle className="text-lg font-medium leading-6 text-gray-900">
				Import runs
			</DialogTitle>
			<DialogDescription className="mt-2 text-sm font-normal text-gray-700">
				Scheduled runs will be imported in the background. <br /> You can check
				the logs and flower tasks
			</DialogDescription>
			<ul className="flex flex-col gap-2 mt-2 divide-y divide-border-primary">
				{props.results.map(({ url, taskId }) => (
					<li key={url}>
						<div className="flex items-center gap-4 p-2">
							<div className="flex flex-col w-24 gap-1">
								{taskId && (
									<>
										<a
											href={`${config.oldBaseUrl}/v1/logs/${taskId}`}
											target="_blank"
											rel="noreferrer"
											className="relative inline-flex items-center justify-start px-2 w-fit transition-all appearance-none select-none whitespace-nowrap text-primary bg-primary-wash rounded-md gap-1 h-[1.625rem] border-2 border-transparent hover:border-[#94b0ff] text-xs"
										>
											<Icon name="BoxArrowRight" />
											<span>Logs</span>
										</a>
										<a
											href={`${config.oldBaseUrl}/flower/task/${taskId}`}
											target="_blank"
											rel="noreferrer"
											className="relative inline-flex items-center justify-start px-2 w-fit transition-all appearance-none select-none whitespace-nowrap text-primary bg-primary-wash rounded-md gap-1 h-[1.625rem] border-2 border-transparent hover:border-[#94b0ff] text-xs"
										>
											<Icon name="BoxArrowRight" />
											<span>Flower</span>
										</a>
									</>
								)}
							</div>
							<div className="w-24">
								<div
									className={statusBadgeStyles({
										expected: Boolean(taskId),
										unexpected: !taskId
									})}
								>
									{taskId ? 'STARTED' : 'FAILED'}
								</div>
							</div>
							<div className="flex-grow">
								<a
									href={url ?? ''}
									className="text-sm font-normal hover:underline"
									target="_blank"
									rel="noreferrer"
								>
									{url}
								</a>
							</div>
						</div>
					</li>
				))}
			</ul>
		</div>
	);
};
