/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Control, FieldValues, Path, useController } from 'react-hook-form';

import { Input, InputProps } from '../input';

export type TextFieldProps<T extends FieldValues> = InputProps & {
	name: Path<T>;
	control: Control<T, unknown>;
};

export const TextField = <T extends FieldValues>({
	control,
	...props
}: TextFieldProps<T>) => {
	const { field, fieldState } = useController({
		name: props.name,
		control: control
	});

	return <Input error={fieldState.error?.message} {...field} {...props} />;
};
