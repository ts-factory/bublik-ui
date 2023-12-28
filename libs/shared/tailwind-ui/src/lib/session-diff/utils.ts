/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
	diffChars,
	diffCss,
	diffWords,
	diffWordsWithSpace,
	diffSentences,
	diffLines,
	diffTrimmedLines
} from 'diff';

export enum DiffType {
	DEFAULT = 'default',
	ADDED = 'added',
	REMOVED = 'removed'
}

export enum DiffMethod {
	CHARS = 'diffChars',
	WORDS = 'diffWords',
	WORDS_WITH_SPACE = 'diffWordsWithSpace',
	LINES = 'diffLines',
	TRIMMED_LINES = 'diffTrimmedLines',
	SENTENCES = 'diffSentences',
	CSS = 'diffCss'
}

export interface DiffInformation {
	value?: string | DiffInformation[];
	lineNumber?: number;
	type?: DiffType;
}

export interface LineInformation {
	left?: DiffInformation;
	right?: DiffInformation;
}

export interface ComputedLineInformation {
	lineInformation: LineInformation[];
	diffLines: number[];
}

export interface ComputedDiffInformation {
	left?: DiffInformation[];
	right?: DiffInformation[];
}

const jsDiff = {
	[DiffMethod.CHARS]: diffChars,
	[DiffMethod.WORDS]: diffWords,
	[DiffMethod.WORDS_WITH_SPACE]: diffWordsWithSpace,
	[DiffMethod.LINES]: diffLines,
	[DiffMethod.TRIMMED_LINES]: diffTrimmedLines,
	[DiffMethod.SENTENCES]: diffSentences,
	[DiffMethod.CSS]: diffCss
} as const;

/**
 * Splits diff text by new line and computes final list of diff lines based on
 * conditions.
 *
 * @param value Diff text from the js diff module.
 */
const constructLines = (value: string): string[] => {
	const lines = value.split('\n');
	const isAllEmpty = lines.every((val): boolean => !val);
	if (isAllEmpty) {
		// This is to avoid added an extra new line in the UI.
		if (lines.length === 2) {
			return [];
		}
		lines.pop();
		return lines;
	}

	const lastLine = lines[lines.length - 1];
	const firstLine = lines[0];
	// Remove the first and last element if they are new line character. This is
	// to avoid addition of extra new line in the UI.
	if (!lastLine) {
		lines.pop();
	}
	if (!firstLine) {
		lines.shift();
	}
	return lines;
};

const computeDiff = (
	oldValue: string,
	newValue: string,
	compareMethod = DiffMethod.CHARS
): ComputedDiffInformation => {
	const diffArray = jsDiff[compareMethod](oldValue, newValue);

	const computedDiff: ComputedDiffInformation = {
		left: [],
		right: []
	};

	diffArray.forEach(({ added, removed, value }): DiffInformation => {
		const diffInformation: DiffInformation = {};

		if (added) {
			diffInformation.type = DiffType.ADDED;
			diffInformation.value = value;
			computedDiff.right?.push(diffInformation);
		}

		if (removed) {
			diffInformation.type = DiffType.REMOVED;
			diffInformation.value = value;
			computedDiff.left?.push(diffInformation);
		}

		if (!removed && !added) {
			diffInformation.type = DiffType.DEFAULT;
			diffInformation.value = value;
			computedDiff.right?.push(diffInformation);
			computedDiff.left?.push(diffInformation);
		}

		return diffInformation;
	});

	return computedDiff;
};

export interface ComputeLineInfoConfig {
	oldString: string;
	newString: string;
	disableWordDiff?: boolean;
	compareMethod?: DiffMethod;
	linesOffset?: number;
}

export const computeLineInformation = (
	config: ComputeLineInfoConfig
): ComputedLineInformation => {
	const {
		oldString,
		newString,
		disableWordDiff = false,
		compareMethod = DiffMethod.WORDS,
		linesOffset = 0
	} = config;

	interface GetLineInfoConfig {
		value: string;
		diffIndex: number;
		added?: boolean;
		removed?: boolean;
		evaluateOnlyFirstLine?: boolean;
	}

	const getLineInformation = (config: GetLineInfoConfig): LineInformation[] => {
		const { value, diffIndex, added, removed, evaluateOnlyFirstLine } = config;

		const lines = constructLines(value);

		return lines
			.map((line: string, lineIndex): LineInformation => {
				const left: DiffInformation = {};
				const right: DiffInformation = {};

				if (
					ignoreDiffIndexes.includes(`${diffIndex}-${lineIndex}`) ||
					(evaluateOnlyFirstLine && lineIndex !== 0)
				) {
					// @ts-ignore
					return undefined;
				}
				if (added || removed) {
					if (!diffLines.includes(counter)) diffLines.push(counter);

					if (removed) {
						leftLineNumber += 1;
						left.lineNumber = leftLineNumber;
						left.type = DiffType.REMOVED;
						left.value = line || ' ';
						// When the current line is of type REMOVED, check the next item in
						// the diff array whether it is of type ADDED. If true, the current
						// diff will be marked as both REMOVED and ADDED. Meaning, the
						// current line is a modification.
						const nextDiff = diffArray[diffIndex + 1];
						if (nextDiff && nextDiff.added) {
							const nextDiffLines = constructLines(nextDiff.value)[lineIndex];
							if (nextDiffLines) {
								const {
									// @ts-ignore
									value: rightValue,
									// @ts-ignore
									lineNumber,
									// @ts-ignore
									type
								} = getLineInformation({
									value: nextDiff.value,
									diffIndex,
									added: true,
									removed: false,
									evaluateOnlyFirstLine: true
								})[0].right;
								// When identified as modification, push the next diff to ignore
								// list as the next value will be added in this line computation as
								// right and left values.
								ignoreDiffIndexes.push(`${diffIndex + 1}-${lineIndex}`);
								right.lineNumber = lineNumber;
								right.type = type;
								// Do word level diff and assign the corresponding values to the
								// left and right diff information object.
								if (disableWordDiff) {
									right.value = rightValue;
								} else {
									const computedDiff = computeDiff(
										line,
										rightValue as string,
										compareMethod
									);
									right.value = computedDiff.right;
									left.value = computedDiff.left;
								}
							}
						}
					} else {
						rightLineNumber += 1;
						right.lineNumber = rightLineNumber;
						right.type = DiffType.ADDED;
						right.value = line;
					}
				} else {
					leftLineNumber += 1;
					rightLineNumber += 1;

					left.lineNumber = leftLineNumber;
					left.type = DiffType.DEFAULT;
					left.value = line;
					right.lineNumber = rightLineNumber;
					right.type = DiffType.DEFAULT;
					right.value = line;
				}

				counter += 1;
				return { right, left };
			})
			.filter(Boolean);
	};

	let rightLineNumber = linesOffset;
	let leftLineNumber = linesOffset;
	let lineInformation: LineInformation[] = [];
	let counter = 0;
	const diffLines: number[] = [];
	const ignoreDiffIndexes: string[] = [];

	const diffArray = jsDiff.diffLines(oldString.trimEnd(), newString.trimEnd(), {
		newlineIsToken: true,
		ignoreWhitespace: false,
		ignoreCase: false
	});

	diffArray.forEach(({ added, removed, value }, diffIndex) => {
		lineInformation = [
			...lineInformation,
			...getLineInformation({ value, diffIndex, added, removed })
		];
	});

	return { lineInformation, diffLines };
};
