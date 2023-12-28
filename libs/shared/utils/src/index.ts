/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { z } from 'zod';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';

export * from './lib/misc';
export * from './lib/tree';
export * from './lib/time';
export * from './lib/format';
export * from './lib/compress-tests';
export * from './lib/router';
export * from './lib/form';

export const checkSchema = <SchemaType>(
	schema: z.ZodSchema<SchemaType>,
	data: unknown
): data is SchemaType => {
	return schema.safeParse(data).success;
};

export {
	uniqBy,
	isFunction,
	isDefined,
	equals,
	differenceWith,
	range,
	clone
} from 'remeda';
export { debounce, throttle };

export const isFocusInInput = (event: KeyboardEvent) => {
	const target = event.target as Element;

	return (
		/input|textarea/i.test(target.tagName) ||
		target.getAttribute('contenteditable') !== null
	);
};
