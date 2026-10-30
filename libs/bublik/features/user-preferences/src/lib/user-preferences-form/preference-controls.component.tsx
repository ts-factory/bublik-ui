/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useId } from 'react';

import { Switch } from '@/shared/tailwind-ui';

interface PreferenceGroupHeadingProps {
	id: string;
	title: string;
	description?: string;
}

/** The title of a set of choices; the choices' group is labelled by `id`. */
function PreferenceGroupHeading(props: PreferenceGroupHeadingProps) {
	const { id, title, description } = props;

	return (
		<div className="flex flex-col gap-1">
			<span id={id} className="text-sm font-semibold text-text-primary">
				{title}
			</span>
			{description ? (
				<p className="text-xs leading-4 text-text-menu">{description}</p>
			) : null}
		</div>
	);
}

interface PreferenceSwitchProps {
	label: string;
	description?: string;
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
}

/** A settings row: the label and description, with the switch on the right. */
function PreferenceSwitch(props: PreferenceSwitchProps) {
	const { label, description, checked, onCheckedChange } = props;
	const id = useId();
	const descriptionId = `${id}-description`;

	return (
		<div className="flex items-start justify-between gap-4 rounded-lg border border-border-input bg-bg-primary px-4 py-3">
			<div className="flex min-w-0 flex-col gap-1">
				<label
					htmlFor={id}
					className="cursor-pointer text-sm font-semibold text-text-primary"
				>
					{label}
				</label>
				{description ? (
					<p id={descriptionId} className="text-xs leading-4 text-text-menu">
						{description}
					</p>
				) : null}
			</div>
			<Switch
				id={id}
				aria-describedby={description ? descriptionId : undefined}
				checked={checked}
				onCheckedChange={onCheckedChange}
				className="mt-0.5"
			/>
		</div>
	);
}

export { PreferenceGroupHeading, PreferenceSwitch };
export type { PreferenceGroupHeadingProps, PreferenceSwitchProps };
