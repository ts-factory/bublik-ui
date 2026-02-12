/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { InstructionDialog } from '@/shared/tailwind-ui';

import resultLinkFromLog from './images/result-from-log.webp';
import resultLinkFromRunDetails from './images/result-from-run.webp';
import resultLinkFromHistory from './images/result-from-history.webp';

export function ResultMeasurementsDialog() {
	return (
		<InstructionDialog
			dialogTitle="Result"
			dialogDescription="Follow these steps to view result measurements."
			steps={[
				{
					title: 'You can visit result from the Log Page',
					description: 'Visit the Log page to view the log.',
					image: resultLinkFromLog
				},
				{
					title: 'You can visit result from the Run Details Page',
					description: 'Visit the Run Details page to view the run details.',
					image: resultLinkFromRunDetails
				},
				{
					title: 'You can visit result from the History Page',
					description: 'Visit the History page to view the history.',
					image: resultLinkFromHistory
				}
			]}
		/>
	);
}
