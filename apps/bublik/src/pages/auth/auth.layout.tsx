/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { PropsWithChildren } from 'react';

export const AuthLayout = (props: PropsWithChildren) => {
	return (
		<div className="relative grid h-screen place-items-center">
			{props.children}
		</div>
	);
};
