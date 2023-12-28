/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { z } from 'zod';

export const LevelModelSchema = z
	.enum(['ERROR', 'WARN', 'INFO', 'VERB', 'PACKET', 'RING'])
	.or(z.string())
	.describe('Log level');

// Model representing test/package/session
export const LogEntityModelSchema = z
	.object({
		id: z.string().describe('Test or package id'),
		name: z.string().describe('Test or package name'),
		entity: z.string().describe('Entity type'),
		result: z.string().describe('Result of the test or package'),
		error: z
			.string()
			.optional()
			.describe('If error message is present result will be in red badge'),
		extended_properties: z
			.record(z.string().or(z.number()))
			.describe('Additional properties to add such as hash/tin')
	})
	.describe('Model representing test/package/session');
