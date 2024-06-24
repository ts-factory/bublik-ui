/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { PropsWithChildren } from 'react';

import { Icon, Tooltip } from '@/shared/tailwind-ui';

import { FormSectionHeader } from './section-header';

interface FormSectionProps {
	label: string;
	error?: string;
	resetTooltipMessage?: string;
	onResetClick?: () => void;
}

function FormSection(props: PropsWithChildren<FormSectionProps>) {
	function handleResetClick() {
		props.onResetClick?.();
	}

	return (
		<fieldset className="border border-border-primary rounded-xl py-2 relative">
			<FormSectionHeader
				name={props.label}
				className="absolute left-4 -top-2 z-20 bg-white"
			/>

			{props.onResetClick ? (
				<div className="grid place-items-center absolute right-4 -top-3 z-20 bg-white">
					<Tooltip content={props.resetTooltipMessage ?? 'Reset'}>
						<button
							type="button"
							className="p-0.5 bg-transparent hover:bg-red-100 hover:text-text-unexpected text-text-menu rounded transition-colors"
							onClick={handleResetClick}
						>
							<Icon name="Bin" size={20} />
						</button>
					</Tooltip>
				</div>
			) : null}
			<div className="py-4">
				{props.error && (
					<div className="mb-4 bg-red-100 rounded-md px-3 py-1.5">
						<Icon
							name="TriangleExclamationMark"
							className="text-text-unexpected inline-block mx-2"
							size={24}
						/>
						<span className="text-[0.75rem] leading-[0.875rem] text-text-unexpected">
							{props.error}
						</span>
					</div>
				)}
				{props.children}
			</div>
		</fieldset>
	);
}

export { FormSection };
