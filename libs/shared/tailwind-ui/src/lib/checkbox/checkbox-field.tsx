/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { CheckedState } from '@radix-ui/react-checkbox';
import { Control, FieldValues, Path, useController } from 'react-hook-form';
import { useId } from 'react';

import { Checkbox, CheckboxProps } from './checkbox';

export type CheckboxFieldProps<T extends FieldValues> = CheckboxProps & {
	name: Path<T>;
	control: Control<T, unknown>;
};

export const CheckboxField = <T extends FieldValues>({
	control,
	...props
}: CheckboxFieldProps<T>) => {
	const { field } = useController({ name: props.name, control: control });
	const checkId = useId();

	const isChecked = Array.isArray(field.value)
		? field.value.includes(props.value)
		: Boolean(field.value);

	const handleChange = (_isChecked: CheckedState) => {
		if (!Array.isArray(field.value)) {
			field.onChange(!isChecked);
			return;
		}

		const set = new Set(field.value);

		if (set.has(props.value)) {
			set.delete(props.value);
		} else {
			set.add(props.value);
		}

		field.onChange(Array.from(set));
	};

	const id = `${checkId}_${field.name}`;

	return (
		<Checkbox
			{...props}
			id={id}
			checked={isChecked}
			onCheckedChange={handleChange}
			ref={field.ref}
			onBlur={field.onBlur}
		/>
	);
};
