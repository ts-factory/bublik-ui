/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { InstructionDialog } from '@/shared/tailwind-ui';

import logLinkFromRuns from './images/log-link.webp';
import logLinkFromRunDetails from './images/log-from-run.webp';
import logLinkFromHistory from './images/log-from-history.webp';

export function LogDialog() {
	return (
		<InstructionDialog
			dialogTitle="Log"
			dialogDescription="Follow these steps to view log."
			steps={[
				{
					title: 'You can visit log from the Runs Page',
					description: 'Visit the Runs page to view the runs.',
					image: logLinkFromRuns
				},
				{
					title: 'You can visit log from the Run Details Page',
					description: 'Visit the Run Details page to view the run details.',
					image: logLinkFromRunDetails
				},
				{
					title: 'You can visit log from the History Page',
					description: 'Visit the History page to view the history.',
					image: logLinkFromHistory
				}
			]}
		/>
	);
}
