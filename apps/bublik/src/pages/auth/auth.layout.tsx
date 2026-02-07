/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { PropsWithChildren, Suspense } from 'react';

import { Spinner } from '@/shared/tailwind-ui';

export const AuthLayout = (props: PropsWithChildren) => {
	return (
		<div className="relative grid h-screen place-items-center">
			<Suspense fallback={<Spinner className="h-screen" />}>
				{props.children}
			</Suspense>
		</div>
	);
};
