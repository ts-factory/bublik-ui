/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Fragment, ReactNode, useMemo } from 'react';

import {
	computeLineInformation,
	DiffInformation,
	DiffMethod,
	DiffType,
	LineInformation
} from './utils';
import { cva } from '../utils';

const cellStyles = cva({
	variants: {
		isAdded: { true: 'bg-diff-added dark:bg-[rgba(70,149,74,0.15)]' },
		isRemoved: { true: 'bg-diff-removed dark:bg-[rgba(229,83,75,0.15)]' },
		noContent: { true: '' }
	}
});

const gutterStyles = cva({
	variants: {
		isAdded: { true: 'bg-[#ccffd8] dark:bg-[rgba(87,171,90,0.3)]' },
		isRemoved: { true: 'bg-[#ffd7d5] dark:bg-[rgba(229,83,75,0.3)]' },
		noContent: { true: '' }
	}
});

const wordStyles = cva({
	variants: {
		isAdded: { true: 'bg-[#abf2bc] dark:bg-[rgba(70,149,74,0.4)]' },
		isRemoved: {
			true: 'bg-[rgba(255,129,130,0.4)] dark:bg-[rgba(229,83,75,0.4)]'
		},
		noContent: { true: 'bg-slate-100' }
	}
});

export interface WordDiffProps {
	diffs: DiffInformation[];
}

export const WordDiff = ({ diffs }: WordDiffProps) => {
	return (
		<Fragment>
			{diffs.map(({ value, type }, i) => {
				const isAdded = type === DiffType.ADDED;
				const isRemoved = type === DiffType.REMOVED;

				return (
					<span key={i} className={`${wordStyles({ isAdded, isRemoved })}`}>
						{value as string}
					</span>
				);
			})}
		</Fragment>
	);
};

export interface LineDiffProps {
	lineNumber?: number | null;
	additionalLineNumber?: number;
	type?: DiffType;
	value?: string | DiffInformation[];
}

export const LineDiff = ({
	lineNumber,
	type,
	value,
	additionalLineNumber
}: LineDiffProps) => {
	const isAdded = type === DiffType.ADDED;
	const isRemoved = type === DiffType.REMOVED;

	let content: ReactNode;
	if (Array.isArray(value)) {
		content = <WordDiff diffs={value} />;
	} else {
		content = value;
	}

	return (
		<Fragment>
			{/* Line number */}
			<td
				className={`select-none min-w-[50px] px-[10px] text-right ${gutterStyles(
					{
						isAdded,
						isRemoved
					}
				)}`}
			>
				{lineNumber && <pre>{lineNumber}</pre>}
			</td>
			{/* Additional line number */}
			<td
				className={`select-none min-w-[50px] px-[10px] text-right ${gutterStyles(
					{
						isAdded,
						isRemoved
					}
				)}`}
			>
				{additionalLineNumber && <pre>{additionalLineNumber}</pre>}
			</td>
			{/* Marker */}
			<td
				className={`w-[25px] px-[10px] select-none ${gutterStyles({
					isAdded,
					isRemoved
				})}`}
			>
				<pre>
					{isAdded && '+'}
					{isRemoved && '-'}
				</pre>
			</td>
			{/* Content */}
			<td
				className={`${cellStyles({ isAdded, isRemoved, noContent: !content })}`}
			>
				<pre>{content}</pre>
			</td>
		</Fragment>
	);
};

export interface SplitViewProps {
	diffLines: LineInformation[];
}

export const SplitView = (props: SplitViewProps) => {
	return (
		<Fragment>
			{props.diffLines.map((line, idx) => (
				<tr key={idx} className="align-baseline">
					<LineDiff
						lineNumber={line.left?.lineNumber}
						type={line.left?.type}
						value={line.left?.value}
					/>
					<LineDiff
						lineNumber={line.right?.lineNumber}
						type={line.right?.type}
						value={line.right?.value}
					/>
				</tr>
			))}
		</Fragment>
	);
};

export interface LineViewProps {
	diffLines: LineInformation[];
}

export const LineView = (props: LineViewProps) => {
	return (
		<Fragment>
			{props.diffLines.map(({ left, right }, idx) => {
				let content: ReactNode;
				// 1. Changed line
				if (left?.type === DiffType.REMOVED && right?.type === DiffType.ADDED) {
					return (
						<Fragment key={idx}>
							<tr>
								<LineDiff
									lineNumber={left.lineNumber}
									type={left.type}
									value={left.value}
								/>
							</tr>
							<tr>
								<LineDiff
									lineNumber={null}
									type={right.type}
									value={right.value}
									additionalLineNumber={right.lineNumber}
								/>
							</tr>
						</Fragment>
					);
				}

				// 2. Removed line
				if (left?.type === DiffType.REMOVED) {
					content = (
						<LineDiff
							lineNumber={left.lineNumber}
							type={left.type}
							value={left.value}
						/>
					);
				}

				// 3. Skipped line
				if (left?.type === DiffType.DEFAULT) {
					content = (
						<LineDiff
							lineNumber={left.lineNumber}
							additionalLineNumber={right?.lineNumber}
							type={left.type}
							value={left.value}
						/>
					);
				}

				// 4. Added line
				if (right?.type === DiffType.ADDED) {
					content = (
						<LineDiff
							lineNumber={null}
							additionalLineNumber={right.lineNumber}
							type={right.type}
							value={right.value}
						/>
					);
				}

				return <tr key={idx}>{content}</tr>;
			})}
		</Fragment>
	);
};

export interface SessionDiffProps {
	oldValue: string;
	newValue: string;
	viewType?: 'split' | 'line';
	compareMethod?: DiffMethod;
}

export const SessionDiff = (props: SessionDiffProps) => {
	const {
		viewType = 'line',
		compareMethod = DiffMethod.WORDS,
		oldValue,
		newValue
	} = props;

	const { lineInformation } = useMemo(
		() =>
			computeLineInformation({
				oldString: oldValue,
				newString: newValue,
				compareMethod
			}),
		[compareMethod, newValue, oldValue]
	);

	return (
		<table className="w-full overflow-scroll">
			<tbody>
				{viewType === 'split' && <SplitView diffLines={lineInformation} />}
				{viewType === 'line' && <LineView diffLines={lineInformation} />}
			</tbody>
		</table>
	);
};
