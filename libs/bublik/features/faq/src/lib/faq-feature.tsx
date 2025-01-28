/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ReactNode } from 'react';

import { CardHeader } from '@/shared/tailwind-ui';

import { Question, QuestionAnswer } from './questions-section';
import { AskForHelp } from './ask-for-help';

import helpImage from './images/sidebar-help.png';

const QUESTIONS: QuestionAnswer[] = [
	{
		question: 'Where can I see test results across different runs?',
		answer:
			'The History page allows you to view and compare test results across different runs. You can access it from the sidebar or by clicking on "History" link. It provides a powerful multivariate filter to search through iterations, displays results in a table format, and lets you build comparison graphs to analyze trends across runs. You can also quickly access logs and detailed measurements for any test result.'
	},
	{
		question: 'Where can I see an overview of the results of recent runs?',
		answer:
			'The Dashboard page provides a comprehensive overview of recent test runs. It displays a table showing the latest runs with important metadata like run status, configuration, and test results statistics including total tests and unexpected results. This gives you a quick way to monitor ongoing and recently completed test runs.'
	},
	{
		question: 'Where can I see running sessions?',
		answer:
			'The Dashboard page displays all currently running test sessions and recently completed runs. Each run is shown in a table format with detailed metadata including run status, configuration, and test result statistics. You can monitor active runs in real-time and see key metrics like the total number of tests and any unexpected results.'
	},
	{
		question: 'Find a run by tags?',
		answer:
			'You can click on any tag in the interface to quickly filter and find all runs that share that same tag. Tags are clickable links that act as filters, making it easy to group related runs together. This is useful for finding runs that belong to the same test suite, branch, or any other categorization represented by tags.'
	}
];

export interface FaqFeatureProps {
	deployInfo: ReactNode;
}

export const FaqFeature = ({ deployInfo }: FaqFeatureProps) => {
	return (
		<div className="flex flex-col h-screen gap-1 p-2">
			<div className="flex flex-grow gap-1">
				<div className="flex bg-white rounded-md flex-col gap-4">
					<CardHeader label="Page Help" />
					<SidebarHelp />
				</div>
				<div className="bg-white rounded-md flex-1 flex flex-col">
					<CardHeader label="FAQ" />
					<div className="px-6 py-8 flex flex-col gap-4 flex-1">
						<ul className="flex flex-col gap-6">
							{QUESTIONS.map(({ question, answer }) => (
								<Question
									key={`${question}_${answer}`}
									question={question}
									answer={answer}
								/>
							))}
						</ul>
						<div className="mt-auto">{deployInfo}</div>
					</div>
				</div>
			</div>
			<AskForHelp />
		</div>
	);
};

function SidebarHelp() {
	return (
		<div className="flex-grow px-4 py-2">
			<img
				src={helpImage}
				className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
				alt="Sidebar Help"
			/>
		</div>
	);
}
