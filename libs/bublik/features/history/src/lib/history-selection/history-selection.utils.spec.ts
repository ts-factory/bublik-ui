/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { historySelectionScope } from './history-selection.utils';

describe('historySelectionScope', () => {
	it('names the test and the project it is read in', () => {
		expect(
			historySelectionScope({ testName: 'suite/pkg/test', projects: [3] })
		).toBe('history:3:suite/pkg/test');
	});

	it('is the same whatever order the projects come in', () => {
		expect(historySelectionScope({ testName: 'test', projects: [12, 3] })).toBe(
			historySelectionScope({ testName: 'test', projects: [3, 12] })
		);
	});

	it('keeps a history read across every project apart from one project', () => {
		expect(historySelectionScope({ testName: 'test' })).toBe('history::test');
		expect(historySelectionScope({ testName: 'test' })).not.toBe(
			historySelectionScope({ testName: 'test', projects: [3] })
		);
	});

	it('tells two tests apart', () => {
		expect(historySelectionScope({ testName: 'a' })).not.toBe(
			historySelectionScope({ testName: 'b' })
		);
	});

	it('cannot be mistaken for a run page scope', () => {
		expect(historySelectionScope({ testName: '42' })).not.toMatch(/^runs?:/);
	});
});
