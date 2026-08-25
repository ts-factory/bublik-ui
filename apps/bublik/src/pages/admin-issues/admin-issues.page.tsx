/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { IssuesTable } from '@/bublik/features/result-classification';
import { CardHeader, Icon, Tooltip } from '@/shared/tailwind-ui';

export const AdminIssuesPage = () => {
	return (
		<div className="flex flex-col gap-1 p-2" data-testid="admin-issues-page">
			<div className="flex flex-col bg-white rounded">
				<CardHeader label="Issues">
					<Tooltip content="An issue is the cause identity — what is wrong. Its rules decide which results get stamped with it, and whether those results still count as unexpected.">
						<span className="flex items-center gap-1 text-xs text-text-menu">
							<Icon name="InformationCircleQuestionMark" size={16} />
							Issues are created by classifying a result
						</span>
					</Tooltip>
				</CardHeader>
				<IssuesTable />
			</div>
		</div>
	);
};
