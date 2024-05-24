/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { RunReportContainer } from '@/bublik/features/run-report';

function RunReportPage() {
	return (
		<div className="flex flex-col gap-1 p-2">
			<RunReportContainer />
		</div>
	);
}

export { RunReportPage };
