/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Control, FieldValues, Path, useController } from 'react-hook-form';

import { BadgeInput, BadgeInputProps, BadgeItem } from '../badge-input';

export type BadgeFieldProps<T extends FieldValues> = {
	name: Path<T>;
	control: Control<T, unknown>;
	label: string;
	placeholder: BadgeInputProps['placeholder'];
	disabled?: BadgeInputProps['disabled'];
	labelTrailingContent?: BadgeInputProps['labelTrailingContent'];
	trailingContent?: BadgeInputProps['trailingContent'];
};

export const BadgeField = <T extends FieldValues>(
	props: BadgeFieldProps<T>
) => {
	const { field } = useController<T>({
		name: props.name,
		control: props.control
	});

	const handleBadgesChange = (newBadges: BadgeItem[]) => {
		field.onChange(newBadges);
	};

	return (
		<BadgeInput
			{...props}
			onBadgesChange={handleBadgesChange}
			badges={field.value}
			label={props.label}
			// onBlur={field.onBlur}
			ref={field.ref}
		/>
	);
};
