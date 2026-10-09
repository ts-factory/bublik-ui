/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
// No imports: `lone-result.unit.ts` runs this file under plain Node.

/** One result of a run, as a rule's matcher sees it. */
interface RunResult {
	resultId: number;
	/** Packages, then the test: a rule is written for one test path. */
	testPath: string;
	/** `name=value`, as the results endpoint lists them. */
	parameters: string[];
	hasError: boolean;
}

/**
 * A result of the run that a rule for its test, matching on its parameters,
 * stamps alone.
 *
 * A rule's parameters match every result of its test whose own parameters
 * include them, so a result qualifies when no other result of its test in the
 * run carries all of its parameters. A failing one comes first, so the stamp
 * lands where a reader of the run looks; then the smallest id.
 */
function loneResult<T extends RunResult>(results: readonly T[]): T | null {
	const sorted = [...results].sort(
		(a, b) => Number(b.hasError) - Number(a.hasError) || a.resultId - b.resultId
	);

	return (
		sorted.find(
			(candidate) =>
				candidate.parameters.length > 0 &&
				!sorted.some(
					(other) =>
						other !== candidate &&
						other.testPath === candidate.testPath &&
						candidate.parameters.every((parameter) =>
							other.parameters.includes(parameter)
						)
				)
		) ?? null
	);
}

export { loneResult };
export type { RunResult };
