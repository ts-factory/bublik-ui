/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { PropsWithChildren } from 'react';

import { Toaster as SonnerToaster } from '../sonner-toaster';

import { ConnectionStatusProvider } from '../connection-status';
import { TooltipProvider } from '../tooltip';

export const Providers = ({ children }: PropsWithChildren) => {
	return (
		<TooltipProvider disableHoverableContent={true}>
			<ConnectionStatusProvider />
			<SonnerToaster />
			{children}
		</TooltipProvider>
	);
};
