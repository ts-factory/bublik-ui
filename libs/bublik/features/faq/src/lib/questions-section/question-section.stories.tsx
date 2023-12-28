/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StoryFn, Meta } from '@storybook/react';
import { FaqSection } from './question-section';

export default {
	component: FaqSection,
	title: 'help/FAQ Section'
} as Meta<typeof FaqSection>;

export const Primary = {
	args: {
		questions: [
			{
				question: 'Where can I see test results across different runs?',
				answer:
					'History. The history page is an iteration table with a multivariate filter, can build a comparison graph based on the results, and contains test results from different runs.'
			},
			{
				question: 'Where can I see an overview of the results of recent  runs?',
				answer:
					'Dashboard. Dashboard is a table of the freshest runs showing its metadata, total/unexpected results amount.'
			},
			{
				question: 'Where can I see running sessions?',
				answer:
					'Dashboard. Dashboard is a table of the freshest runs showing its metadata, total/unexpected results amount.'
			},
			{ question: 'Find a run by tags?', answer: 'Tags.' }
		]
	}
};
