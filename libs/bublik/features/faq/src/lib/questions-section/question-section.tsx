/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';

import { CardHeader } from '@/shared/tailwind-ui';

export type QuestionAnswer = {
	question: string;
	answer: string;
};

export interface QuestionProps {
	question: string;
	answer: string;
}

export const Question: FC<QuestionProps> = ({ question, answer }) => {
	return (
		<div className="flex flex-col gap-2">
			<h2 className="text-[0.75rem] font-semibold leading-[0.875rem] text-primary">
				{question}
			</h2>
			<p className="text-[0.75rem] font-medium leading-[0.875rem] text-text-secondary">
				{answer}
			</p>
		</div>
	);
};

export interface FaqSectionProps {
	questions: QuestionAnswer[];
}

export const FaqSection: FC<FaqSectionProps> = ({ questions }) => {
	return (
		<div className="bg-white rounded-md">
			<CardHeader label="FAQ" />
			<div className="grid grid-cols-4 gap-8 px-4 py-6">
				{questions.map(({ question, answer }) => (
					<Question
						key={`${question}_${answer}`}
						question={question}
						answer={answer}
					/>
				))}
			</div>
		</div>
	);
};
