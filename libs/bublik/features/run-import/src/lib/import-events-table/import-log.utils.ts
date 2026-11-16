/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ImportJsonLog } from '@/shared/types';

/** One log line as `[time][level](module) message` */
function formatImportLogLine(log: ImportJsonLog): string {
	return `[${log.asctime}][${log.levelname}](${
		log.module
	}) ${log.message.trim()}`;
}

/** The whole log with every column, one entry per line */
function formatImportLog(logs: ImportJsonLog[]): string {
	return logs.map(formatImportLogLine).join('\n');
}

export { formatImportLog, formatImportLogLine };
