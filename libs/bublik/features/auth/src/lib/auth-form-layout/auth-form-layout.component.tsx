/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentPropsWithoutRef, PropsWithChildren } from 'react';

import { cn } from '@/shared/tailwind-ui';

const Circle = ({ className, ...props }: ComponentPropsWithoutRef<'div'>) => {
	return (
		<div
			className={cn(
				'absolute z-0 rounded-full w-96 h-96 blur-3xl mix-blend-multiply opacity-50 animate-auth-blob',
				className
			)}
			{...props}
		/>
	);
};

export type AuthFormLayoutProps = {
	label: string;
	description?: string;
};

export const AuthFormLayout = (
	props: PropsWithChildren<AuthFormLayoutProps>
) => {
	return (
		<>
			<Circle className="bg-primary left-[10%] bottom-[15%]" />
			<Circle
				className="bg-bg-warning right-[25%] top-[10%]"
				style={{ animationDelay: '2s' }}
			/>
			<Circle
				className="bg-bg-error bottom-[10%] right-[17%]"
				style={{ animationDelay: '4s' }}
			/>
			<div className="w-full sm:max-w-md p-6 bg-white sm:rounded-lg md:shadow min-w-[420px] z-10 relative">
				<div className="flex flex-col gap-2 mb-6">
					<h1 className="text-2xl font-bold leading-tight tracking-tight text-text-primary">
						{props.label}
					</h1>
					{props.description ? (
						<p className="text-sm font-light">{props.description}</p>
					) : null}
				</div>
				{props.children}
			</div>
		</>
	);
};
