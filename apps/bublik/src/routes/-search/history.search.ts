/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	boolOf,
	defineSearch,
	delimited,
	enumOf,
	passthrough,
	repeated,
	str,
	type InferSearch
} from '@/router';
import { config } from '@/bublik/config';

const list = () => delimited(config.queryDelimiter);

/**
 * `/history` and `/history/v2`, one schema for both. The form
 * writes every key, empty ones included (`labels=&parameters=&…`), which is
 * why the lists and strings read `key=` as `[]`/`''` and write it back the
 * same way, and why `untriaged`/`explained` spell false as the empty string
 * rather than `false`. `page` and `pageSize` stay strings, as the page reads
 * them. `startDate` and `finishDate` default to a three-month window ending
 * today, computed by the page. `fromRun` is written by prefilled links and
 * never read (the page reads `location.state.fromRun`).
 */
const historySearch = defineSearch(
	{
		testName: str(),
		hash: str(),
		tagExpr: str(),
		labelExpr: str(),
		revisionExpr: str(),
		branchExpr: str(),
		verdictExpr: str(),
		testArgExpr: str(),
		issue: str(),
		parameters: list(),
		revisions: list(),
		branches: list(),
		labels: list(),
		runData: list(),
		// Written `;`-joined by the history form and as a repeated key by the
		// multiple-runs page's history links; the page parses both itself, so
		// the wire value passes through untouched (the URL snapshot pins both).
		runIds: passthrough(),
		runProperties: list(),
		resultProperties: list(),
		results: list(),
		verdict: list(),
		categories: list(),
		startDate: str(),
		finishDate: str(),
		verdictLookup: enumOf(['string', 'regex', 'none']),
		untriaged: boolOf('true', ''),
		explained: boolOf('true', ''),
		page: str(),
		pageSize: str(),
		mode: enumOf([
			'linear',
			'aggregation',
			'measurements',
			'measurements-by-iteration',
			'measurements-combined'
		]),
		combinedPlots: list(),
		'chart-group': enumOf(['trend', 'measurement']),
		parametersByResultFilter: repeated(),
		parametersByResultName: repeated(),
		fromRun: str()
	},
	{
		testName: '',
		hash: '',
		tagExpr: '',
		labelExpr: '',
		revisionExpr: '',
		branchExpr: '',
		verdictExpr: '',
		testArgExpr: '',
		issue: '',
		parameters: [],
		revisions: [],
		branches: [],
		labels: [],
		runData: [],
		runIds: [],
		runProperties: [],
		resultProperties: [],
		results: [],
		verdict: [],
		categories: [],
		parametersByResultFilter: [],
		parametersByResultName: [],
		verdictLookup: 'string',
		untriaged: false,
		explained: false,
		page: '1',
		pageSize: '25',
		mode: 'linear'
	}
);

type HistorySearch = InferSearch<typeof historySearch>;

export { historySearch };
export type { HistorySearch };
