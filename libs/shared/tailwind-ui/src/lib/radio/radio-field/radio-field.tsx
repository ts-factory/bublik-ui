/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Control, FieldValues, Path, useController } from 'react-hook-form';

import { Radio, RadioProps } from '../radio';

export type RadioFieldProps<T extends FieldValues> = RadioProps & {
	name: Path<T>;
	control: Control<T, unknown>;
};

export const RadioField = <T extends FieldValues>({
	name,
	control,
	...restProps
}: RadioFieldProps<T>) => {
	const { field } = useController<T>({
		name,
		control
	});

	const handleChange = () => {
		console.log('CALLING RADIO ON CHANGE', restProps.value);

		field.onChange(restProps.value);
	};

	const isChecked = field.value === restProps.value;

	return (
		<Radio
			{...restProps}
			name={field.name}
			checked={isChecked}
			onChange={handleChange}
			onBlur={field.onBlur}
			ref={field.ref}
		/>
	);
};
