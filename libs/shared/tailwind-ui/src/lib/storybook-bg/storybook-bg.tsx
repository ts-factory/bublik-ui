/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentType } from 'react';

type Decorator = (Story: ComponentType) => JSX.Element;

export const withBackground: Decorator = (Story) => {
	return (
		<div className="p-4 bg-white rounded-md">
			<Story />
		</div>
	);
};
