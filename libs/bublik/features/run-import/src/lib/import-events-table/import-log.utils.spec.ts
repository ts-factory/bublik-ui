/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { formatImportLog, formatImportLogLine } from './import-log.utils';

describe('formatImportLogLine', () => {
	it('puts time, level and module before the message', () => {
		expect(
			formatImportLogLine({
				asctime: '2026-11-16 10:00:01,123',
				levelname: 'INFO',
				module: 'importruns',
				message: 'Run id is 42'
			})
		).toBe('[2026-11-16 10:00:01,123][INFO](importruns) Run id is 42');
	});

	it('trims the message but keeps its inner lines', () => {
		expect(
			formatImportLogLine({
				asctime: 't',
				levelname: 'ERROR',
				module: 'm',
				message: '  Traceback:\n  line 1\n'
			})
		).toBe('[t][ERROR](m) Traceback:\n  line 1');
	});
});

describe('formatImportLog', () => {
	it('joins the lines in order', () => {
		expect(
			formatImportLog([
				{ asctime: 't1', levelname: 'INFO', module: 'a', message: 'one' },
				{ asctime: 't2', levelname: 'DEBUG', module: 'b', message: 'two' }
			])
		).toBe('[t1][INFO](a) one\n[t2][DEBUG](b) two');
	});

	it('is empty for an empty log', () => {
		expect(formatImportLog([])).toBe('');
	});
});
