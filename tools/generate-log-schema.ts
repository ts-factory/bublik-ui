/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { writeFileSync } from 'fs';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { format } from 'prettier';

import { RootBlockSchema } from '../libs/shared/types/src';

(() => {
	const PATH_TO_SCHEMA =
		'libs/bublik/features/session-log/src/lib/v1/schema.json';

	const jsonSchema = zodToJsonSchema(RootBlockSchema);

	writeFileSync(
		PATH_TO_SCHEMA,
		format(JSON.stringify(jsonSchema), {
			parser: 'json',
			useTabs: true,
			singleQuote: true,
			trailingComma: 'none'
		}),
		'utf-8'
	);
})();
