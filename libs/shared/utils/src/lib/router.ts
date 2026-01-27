/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { addDays, addMonths, isBefore, isValid, parseISO } from 'date-fns';
import { Link, To } from 'react-router-dom';
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
	DEFAULT_HISTORY_END_DATE,
	DEFAULT_RESULT_TYPES,
	DEFAULT_VERDICT_LOOKUP
} from '@/bublik/config';
import { stringifySearch } from '@/router';

import { formatTimeToAPI } from './time';

/**
 * If passed date is older than 3 months we extend to 6 months
 * else we default to 3 months range
 */
const getFromDate = (maybeDate: string) => {
	const today = new Date();
	const parsedDate = isValid(parseISO(maybeDate)) ? parseISO(maybeDate) : today;
	const isOlderThanThreeMonths = isBefore(parsedDate, addMonths(today, -3));
	const offsetFromSixMonths = addMonths(parsedDate, -6);
	const passedOffset = addMonths(parsedDate, -3);

	if (isOlderThanThreeMonths) {
		return formatTimeToAPI(addDays(offsetFromSixMonths, -3));
	} else {
		return formatTimeToAPI(addDays(passedOffset, -3));
	}
};

const getToDate = (maybeDate: string) => {
	const parsedDate = isValid(parseISO(maybeDate))
		? parseISO(maybeDate)
		: new Date();

	return formatTimeToAPI(parsedDate);
};

export const buildQuery = (config: {
	result: RunDataResults;
	details: RunDetailsAPIResponse;
}): HistorySearchParams => {
	const { result, details } = config;

	const query = new HistorySearchBuilder(result.name)
		.withAnchorDate(details.start)
		.withParameters(result.parameters)
		.withResultPropertiesBasedOnError(result.has_error)
		.build();

	return {
		...query,
		finishDate: formatTimeToAPI(DEFAULT_HISTORY_END_DATE),
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
		const today = new Date().toISOString();

		this.query = {
			page: '1',
			results: DEFAULT_RESULT_TYPES.join(this.delimiter),
			verdictLookup: DEFAULT_VERDICT_LOOKUP,
			startDate: getFromDate(today),
			finishDate: getToDate(today),
			testName,
			runProperties: RUN_PROPERTIES.NotCompromised
		};
	}

	withAnchorDate(anchorDate: string): HistorySearchBuilder {
		this.query.startDate = getFromDate(anchorDate);
		this.query.finishDate = getToDate(anchorDate);

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

	const testName = new HistorySearchBuilder(testNameOrPath)
		.withAnchorDate(run.finish)
		.withResultPropertiesBasedOnError(result.has_error)
		.build();

	const testNameAndVerdicts = new HistorySearchBuilder(testNameOrPath)
		.withAnchorDate(run.finish)
		.withVerdicts(result.obtained_result.verdicts)
		.withResultPropertiesBasedOnError(result.has_error)
		.build();

	const testNameAndParameters = new HistorySearchBuilder(testNameOrPath)
		.withAnchorDate(run.finish)
		.withParameters(result.parameters)
		.withResultPropertiesBasedOnError(result.has_error)
		.build();

	const testNameAndParametersAndVerdicts = new HistorySearchBuilder(
		testNameOrPath
	)
		.withAnchorDate(run.finish)
		.withParameters(result.parameters)
		.withVerdicts(result.obtained_result.verdicts)
		.withResultPropertiesBasedOnError(result.has_error)
		.build();

	const testNameAndParametersAndImportantTags = new HistorySearchBuilder(
		testNameOrPath
	)
		.withAnchorDate(run.finish)
		.withParameters(result.parameters)
		.withTags(important_tags)
		.withResultPropertiesBasedOnError(result.has_error)
		.build();

	const testNameAndParametersAndAllTags = new HistorySearchBuilder(
		testNameOrPath
	)
		.withAnchorDate(run.finish)
		.withParameters(result.parameters)
		.withResultPropertiesBasedOnError(result.has_error)
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
