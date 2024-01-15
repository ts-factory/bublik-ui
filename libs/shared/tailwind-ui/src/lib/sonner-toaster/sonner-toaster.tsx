/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import React from 'react';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
	return (
		<Sonner
			theme="light"
			className="toaster group"
			position="top-right"
			toastOptions={{
				classNames: {
					toast:
						'group toast group-[.toaster]:bg-white group-[.toaster]:text-text-primary group-[.toaster]:border-border group-[.toaster]:shadow-lg',
					description: 'group-[.toast]:text-text-menu',
					actionButton:
						'group-[.toast]:bg-primary group-[.toast]:text-white group-[.toast]:rounded-md',
					cancelButton:
						'group-[.toast]:bg-bg-error group-[.toast]:text-white group-[.toast]:rounded-md',
					success: 'group-[.toaster_[data-icon]]:text-bg-ok',
					error: 'group-[.toaster_[data-icon]]:text-bg-error',
					warning: 'group-[.toaster_[data-icon]]:text-bg-warning',
					info: 'group-[.toaster_[data-icon]]:text-primary'
				}
			}}
			{...props}
		/>
	);
};

export { Toaster };
