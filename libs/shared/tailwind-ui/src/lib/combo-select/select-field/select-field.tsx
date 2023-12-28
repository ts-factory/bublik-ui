/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Control, FieldValues, Path, useController } from 'react-hook-form';

import { SelectInput, SelectProps } from '../select';

export type SelectFieldProps<T extends FieldValues> = SelectProps & {
	name: Path<T>;
	control: Control<T>;
};

export const SelectField = <T extends FieldValues>(
	props: SelectFieldProps<T>
) => {
	const { field } = useController({
		name: props.name,
		control: props.control
	});

	return (
		<SelectInput
			{...props}
			{...field}
			onValueChange={field.onChange}
			ref={field.ref}
		/>
	);
};
