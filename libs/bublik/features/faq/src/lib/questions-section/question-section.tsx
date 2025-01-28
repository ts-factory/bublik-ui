/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
export type QuestionAnswer = {
	question: string;
	answer: string;
};

export interface QuestionProps {
	question: string;
	answer: string;
}

export function Question({ question, answer }: QuestionProps) {
	return (
		<li className="p-4 bg-primary-wash rounded-lg transition-colors duration-200">
			<h2 className="text-base font-semibold leading-6 text-primary mb-2">
				{question}
			</h2>
			<p className="text-sm leading-6 text-text-secondary">{answer}</p>
		</li>
	);
}
