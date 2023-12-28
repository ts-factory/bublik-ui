/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Control, FieldValues, Path, useController } from 'react-hook-form';

import { TextArea, TextAreaProps } from './text-area';

export interface TextAreaFieldProps<T extends FieldValues>
	extends TextAreaProps {
	name: Path<T>;
	control: Control<T, unknown>;
}

export const TextAreaField = <T extends FieldValues>(
	props: TextAreaFieldProps<T>
) => {
	const { field, fieldState } = useController({
		name: props.name,
		control: props.control
	});

	return <TextArea error={fieldState.error?.message} {...field} {...props} />;
};
