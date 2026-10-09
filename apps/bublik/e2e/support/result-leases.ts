/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
// Node built-ins only: `result-leases.unit.ts` runs this file under plain Node.
import {
	closeSync,
	linkSync,
	openSync,
	readFileSync,
	renameSync,
	statSync,
	unlinkSync,
	writeSync
} from 'node:fs';
import { join } from 'node:path';

interface LeasableResult {
	resultId: number;
	runId: number;
	testPath: string;
	/** Results of one run that share an iteration match the same rules. */
	iteration: number;
}

interface LeaseOwner {
	pid: number;
	label: string;
}

interface LeaseBookOptions {
	/** Whether the process `pid` still runs; the unit tests interleave here. */
	isAlive?: (pid: number) => boolean;
}

/**
 * The classifiable results the write scenarios lease while they stamp them.
 *
 * A write scenario stamps a failing result under an issue of its own and
 * deletes that issue as its last step, which takes the stamp and the rule with
 * it. The result is only the scenario's while the issue exists, so it leases
 * the result for the length of the scenario and gives it back afterwards: the
 * pool has to hold as many results as there are scenarios running at once,
 * not as many as there are scenarios.
 *
 * A lease is a file named after the result (`result-<id>`) or the run
 * (`run-<id>`), created exclusively in a directory every Playwright worker of
 * every run against the same stack shares, so workers in other processes see
 * it. It records its owner's pid: a lease whose process has exited is taken
 * over, atomically, so a crashed worker never strands a result.
 *
 * - `tryResult` leases one failing result, in a run no test lease holds.
 * - `tryTest` leases a whole run, for a scenario that applies rules to it,
 *   and hands back every result of one test in it. It only takes a run no
 *   result lease is in, and while it holds the run no result lease enters,
 *   so no rule written by another scenario stamps the run between its passes
 *   — the rules of a result lease are gone before its run is free again.
 */
class LeaseBook {
	private readonly dir: string;
	private readonly owner: LeaseOwner;
	private readonly files: string[] = [];
	private readonly results: number[] = [];
	private readonly isAlive: (pid: number) => boolean;

	constructor(dir: string, label: string, options: LeaseBookOptions = {}) {
		this.dir = dir;
		this.owner = { pid: process.pid, label };
		this.isAlive = options.isAlive ?? isAlive;
	}

	/** The result ids this book holds. */
	held(): number[] {
		return [...this.results];
	}

	tryResult<T extends LeasableResult>(pool: readonly T[]): T | null {
		for (const entry of uniqueSorted(pool)) {
			if (this.isLeased(runFile(entry.runId))) continue;
			if (!this.take(resultFile(entry.resultId))) continue;

			// A test lease may have taken the run between the check and the take.
			if (this.isLeased(runFile(entry.runId))) {
				this.drop(resultFile(entry.resultId));
				continue;
			}

			this.results.push(entry.resultId);

			return entry;
		}

		return null;
	}

	tryTest<T extends LeasableResult>(pool: readonly T[]): T[] | null {
		const results = uniqueSorted(pool);
		const runIds = [...new Set(results.map((entry) => entry.runId))];

		for (const runId of runIds) {
			const inRun = results.filter((entry) => entry.runId === runId);
			const busy = () =>
				inRun.some((entry) => this.isLeased(resultFile(entry.resultId)));

			if (busy()) continue;
			if (!this.take(runFile(runId))) continue;

			// A result lease may have entered the run between the check and the take.
			if (busy()) {
				this.drop(runFile(runId));
				continue;
			}

			const group = testGroup(results, inRun);
			this.results.push(...group.map((entry) => entry.resultId));

			return group;
		}

		return null;
	}

	/** Gives back every lease this book took. */
	release(): void {
		for (const file of this.files.splice(0)) this.unlink(file);
		this.results.splice(0);
	}

	private take(name: string): boolean {
		const path = join(this.dir, name);

		for (let attempt = 0; attempt < 2; attempt += 1) {
			try {
				const fd = openSync(path, 'wx');
				writeSync(fd, JSON.stringify(this.owner));
				closeSync(fd);
				this.files.push(path);

				return true;
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
				if (this.isLeased(name)) return false;
				// Its owner has exited: the dead lease was just reclaimed; try again.
			}
		}

		return false;
	}

	private drop(name: string): void {
		const path = join(this.dir, name);
		const index = this.files.indexOf(path);

		if (index >= 0) this.files.splice(index, 1);
		this.unlink(path);
	}

	/** Whether a live process holds `name`; removes the lease if its owner exited. */
	private isLeased(name: string): boolean {
		const path = join(this.dir, name);
		const owner = this.ownerOf(path);

		if (owner === 'none') return false;
		if (owner === 'live') return true;

		return !this.reclaim(path);
	}

	private ownerOf(path: string): 'none' | 'live' | 'dead' {
		let owner: Partial<LeaseOwner>;

		try {
			owner = JSON.parse(readFileSync(path, 'utf-8')) as Partial<LeaseOwner>;
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') return 'none';
			// Created but not yet written: its owner is mid-take, unless it died
			// there, which an empty file left that long gives away.
			if (!this.olderThan(path, UNWRITTEN_LEASE_MS)) return 'live';
			owner = {};
		}

		return typeof owner.pid === 'number' && this.isAlive(owner.pid)
			? 'live'
			: 'dead';
	}

	/**
	 * Removes the dead lease at `path`; false if it turned out to be live.
	 *
	 * Another process may find the same lease dead, take it over and hold it
	 * before this one acts, so unlinking `path` could remove that live lease.
	 * Renaming is atomic instead: whatever was at `path` is now this process's
	 * alone to inspect, and a live lease moved aside by mistake is put back.
	 */
	private reclaim(path: string): boolean {
		reclaims += 1;
		const aside = `${path}.reclaim-${process.pid}-${reclaims}`;

		try {
			renameSync(path, aside);
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') return true;
			throw error;
		}

		if (this.ownerOf(aside) !== 'live') {
			this.unlink(aside);

			return true;
		}

		try {
			linkSync(aside, path);
		} catch (error) {
			// A third process took the freed name meanwhile; it holds the lease.
			if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
		}
		this.unlink(aside);

		return false;
	}

	private olderThan(path: string, ms: number): boolean {
		try {
			return Date.now() - statSync(path).mtimeMs > ms;
		} catch {
			return true;
		}
	}

	private unlink(path: string): void {
		try {
			unlinkSync(path);
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
		}
	}
}

/** How long a lease file may stay empty before its owner counts as dead. */
const UNWRITTEN_LEASE_MS = 10_000;

/** Makes each reclaim's temporary name unique within this process. */
let reclaims = 0;

function resultFile(resultId: number): string {
	return `result-${resultId}`;
}

function runFile(runId: number): string {
	return `run-${runId}`;
}

function isAlive(pid: number): boolean {
	try {
		process.kill(pid, 0);

		return true;
	} catch (error) {
		return (error as NodeJS.ErrnoException).code === 'EPERM';
	}
}

function uniqueSorted<T extends LeasableResult>(pool: readonly T[]): T[] {
	const byId = new Map<number, T>();
	for (const entry of pool) byId.set(entry.resultId, entry);

	return [...byId.values()].sort((a, b) => a.resultId - b.resultId);
}

/**
 * Every result of one test in `inRun`: a test whose results all share their
 * iteration first (a rule for it is sure to stamp more than one), then the
 * smallest.
 */
function testGroup<T extends LeasableResult>(
	results: readonly T[],
	inRun: readonly T[]
): T[] {
	const byTest = new Map<string, T[]>();
	for (const entry of inRun) {
		byTest.set(entry.testPath, [...(byTest.get(entry.testPath) ?? []), entry]);
	}

	const siblings = (group: T[]) =>
		group.every((entry) =>
			results.some(
				(other) =>
					other !== entry &&
					other.runId === entry.runId &&
					other.iteration === entry.iteration
			)
		)
			? 0
			: 1;

	return [...byTest.values()].sort(
		(a, b) =>
			siblings(a) - siblings(b) ||
			a.length - b.length ||
			a[0].testPath.localeCompare(b[0].testPath)
	)[0];
}

export { LeaseBook };
export type { LeasableResult };
