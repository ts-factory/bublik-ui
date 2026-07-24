/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { isValid, parseISO } from 'date-fns';
import { createPath, Link, parsePath, To } from 'react-router-dom';
import { ComponentProps } from 'react';

import {
	RunDetailsAPIResponse,
	HistoryAPIQuery,
	HistoryMode,
	HistorySearchParams,
	RESULT_PROPERTIES,
	RUN_PROPERTIES,
	RunDataResults
} from '@/shared/types';
import {
	config,
	DEFAULT_RESULT_TYPES,
	DEFAULT_VERDICT_LOOKUP,
	getDefaultHistoryDateRange
} from '@/bublik/config';
import { stringifySearch } from '@/router';

import { formatTimeToAPI } from './time';

/**
 * Parses a URL, lets the callback rewrite its search params (mutate in place
 * or return a replacement), and reassembles the URL with the hash intact.
 */
export const transformUrlSearch = (
	url: string,
	transform: (params: URLSearchParams) => URLSearchParams | void
): string => {
	const path = parsePath(url);
	const params = new URLSearchParams(path.search ?? '');
	const search = (transform(params) ?? params).toString();

	return createPath({
		pathname: path.pathname ?? '',
		search: search ? `?${search}` : '',
		hash: path.hash
	});
};

export const buildQuery = (config: {
	result: RunDataResults;
	details: RunDetailsAPIResponse;
}): HistorySearchParams => {
	const { result } = config;

	const query = new HistorySearchBuilder(result.name)
		.withParameters(result.parameters)
		.withResultPropertiesBasedOnError(result.has_error)
		.build();

	return {
		...query,
		results: result.obtained_result.result_type,
		pageSize: '25'
	};
};

export type HistorySearch = {
	testName: ComponentProps<typeof Link>;
	testNameAndVerdicts: ComponentProps<typeof Link>;
	testNameAndParameters: ComponentProps<typeof Link>;
	testNameAndParametersAndImportantTags: ComponentProps<typeof Link>;
	testNameAndParametersAndAllTags: ComponentProps<typeof Link>;
	testNameAndParametersAndVerdicts: ComponentProps<typeof Link>;
};

class HistorySearchBuilder {
	private query: HistoryAPIQuery;
	private delimiter = config.queryDelimiter;

	constructor(testName: string) {
		const { startDate, finishDate } = getDefaultHistoryDateRange();

		this.query = {
			page: '1',
			results: DEFAULT_RESULT_TYPES.join(this.delimiter),
			verdictLookup: DEFAULT_VERDICT_LOOKUP,
			startDate: formatTimeToAPI(startDate),
			finishDate: formatTimeToAPI(finishDate),
			testName,
			runProperties: RUN_PROPERTIES.NotCompromised
		};
	}

	withAnchorDate(anchorDate: string): HistorySearchBuilder {
		const parsedDate = parseISO(anchorDate);

		if (!isValid(parsedDate)) return this;

		const { startDate, finishDate } = getDefaultHistoryDateRange(parsedDate);
		this.query.startDate = formatTimeToAPI(startDate);
		this.query.finishDate = formatTimeToAPI(finishDate);

		return this;
	}

	withRunIds(runIds: number[]): HistorySearchBuilder {
		this.query.runIds = runIds.join(this.delimiter);
		return this;
	}

	/**
	 * Adds test parameters to the query.
	 * @param parameters - Array of parameter strings
	 */
	withParameters(parameters: string[]): HistorySearchBuilder {
		this.query.parameters = parameters.join(this.delimiter);
		return this;
	}

	/**
	 * Adds tags to the query (runData). Can be called multiple times to accumulate tags.
	 * @param tags - Array of tag strings
	 */
	withTags(tags: string[]): HistorySearchBuilder {
		if (tags.length > 0) {
			const newTags = tags.join(this.delimiter);
			if (this.query.runData) {
				this.query.runData += this.delimiter + newTags;
			} else {
				this.query.runData = newTags;
			}
		}
		return this;
	}

	/**
	 * Adds verdict filtering to the query.
	 * @param verdicts - Array of verdict strings (e.g., ['PASS', 'FAIL'])
	 */
	withVerdicts(verdicts: string[]): HistorySearchBuilder {
		if (verdicts.length > 0) {
			this.query.verdict = verdicts.join(this.delimiter);
		}
		return this;
	}

	/**
	 * Sets result properties based on whether there's an error.
	 * @param hasError - Whether the result has an error
	 */
	withResultPropertiesBasedOnError(hasError: boolean): HistorySearchBuilder {
		this.query.resultProperties = hasError
			? RESULT_PROPERTIES.Unexpected
			: RESULT_PROPERTIES.Expected;
		return this;
	}

	withResultProperties(properties: RESULT_PROPERTIES[]): HistorySearchBuilder {
		this.query.resultProperties = properties.join(this.delimiter);
		return this;
	}

	withRunProperties(properties: RUN_PROPERTIES[]): HistorySearchBuilder {
		this.query.runProperties = properties.join(this.delimiter);
		return this;
	}

	build(): HistoryAPIQuery {
		return { ...this.query };
	}
}

interface GetToLocationOptions {
	search: Record<string, string>;
	mode?: HistoryMode;
	preview?: boolean;
}

function getToLocation(options: GetToLocationOptions): To {
	const { search, mode, preview } = options;

	const searchParams = new URLSearchParams(stringifySearch(search));
	searchParams.set('mode', mode ?? 'linear');
	if (preview) searchParams.set('fromRun', 'true');

	return { pathname: '/history', search: searchParams.toString() };
}

interface GetHistorySearchOutput {
	prefilled: HistorySearch;
	direct: HistorySearch;
}

function getHistorySearch(
	run: RunDetailsAPIResponse,
	result: RunDataResults,
	userPreferredHistoryMode: HistoryMode,
	path?: string
): GetHistorySearchOutput {
	const { relevant_tags, important_tags } = run;
	const testNameOrPath = path ?? result.name;

	const testName = new HistorySearchBuilder(testNameOrPath).build();

	const testNameAndVerdicts = new HistorySearchBuilder(testNameOrPath)
		.withVerdicts(result.obtained_result.verdicts)
		.build();

	const testNameAndParameters = new HistorySearchBuilder(testNameOrPath)
		.withParameters(result.parameters)
		.build();

	const testNameAndParametersAndVerdicts = new HistorySearchBuilder(
		testNameOrPath
	)
		.withParameters(result.parameters)
		.withVerdicts(result.obtained_result.verdicts)
		.build();

	const testNameAndParametersAndImportantTags = new HistorySearchBuilder(
		testNameOrPath
	)
		.withParameters(result.parameters)
		.withTags(important_tags)
		.build();

	const testNameAndParametersAndAllTags = new HistorySearchBuilder(
		testNameOrPath
	)
		.withParameters(result.parameters)
		.withTags(relevant_tags)
		.withTags(important_tags)
		.build();

	const searches: Record<keyof HistorySearch, HistoryAPIQuery> = {
		testName,
		testNameAndVerdicts,
		testNameAndParameters,
		testNameAndParametersAndImportantTags,
		testNameAndParametersAndAllTags,
		testNameAndParametersAndVerdicts
	};

	const prefilled = getLinkProps(searches, {
		preview: true,
		mode: userPreferredHistoryMode
	});

	const direct = getLinkProps(searches, {
		preview: false,
		mode: userPreferredHistoryMode
	});

	return { prefilled, direct } as const;
}

function getLinkProps(
	items: Record<keyof HistorySearch, HistoryAPIQuery>,
	options: Omit<GetToLocationOptions, 'search'>
): HistorySearch {
	return Object.fromEntries(
		Object.entries(items).map(([key, search]) => [
			key,
			{
				to: getToLocation({ search, ...options }),
				state: { fromRun: options.preview }
			}
		])
	) as HistorySearch;
}

export { getHistorySearch, HistorySearchBuilder };
