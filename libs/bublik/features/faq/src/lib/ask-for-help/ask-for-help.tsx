/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { PropsWithChildren } from 'react';

export const AskForHelp = ({ children }: PropsWithChildren) => {
	return (
		<div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-md">
			<div className="flex-grow p-5 rounded-lg bg-primary-wash">
				<p className="text-[0.75rem] font-semibold leading-[0.875rem]">
					Can’t find the answer you’re looking for?
				</p>
				<span className="text-[0.75rem] font-semibold leading-[0.875rem]">
					Please contact your administrator
					{/*<a href={`mailto:${contactEmail}`}>{contactEmail}</a>*/}
				</span>
			</div>
			{children}
		</div>
	);
};
