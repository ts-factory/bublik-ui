/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { Fragment, useMemo, useState } from 'react';
import {
	ColumnDef,
	ColumnFiltersState,
	FilterFn,
	SortingState,
	flexRender,
	getCoreRowModel,
	getExpandedRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	useReactTable
} from '@tanstack/react-table';

import {
	getErrorMessage,
	useActivateRuleMutation,
	useDeactivateRuleMutation,
	useGetIssueRulesQuery
} from '@/services/bublik-api';
import {
	Badge,
	ButtonTw,
	DataTableFacetedFilter,
	Icon,
	Input,
	Skeleton,
	TableSort,
	Tooltip,
	cn,
	toast
} from '@/shared/tailwind-ui';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';
import type { IssueRule } from '@/shared/types';

import {
	CATEGORY_ORDER,
	categoryMeta,
	ruleActiveMeta
} from './classification-colors';
import { expectedBadge } from './expected';
import { chipsForFlags } from './match-scope.utils';

const COLUMN_ID = {
	EXPANDER: 'expander',
	TEST: 'test',
	CATEGORY: 'category',
	DISPOSITION: 'disposition',
	SCOPE: 'scope',
	ACTIVE: 'active',
	ACTIONS: 'actions'
} as const;

const DISPOSITION_OPTIONS = [
	{ value: 'true', label: 'Expected' },
	{ value: 'false', label: 'Unexpected' },
	{ value: 'none', label: 'None' }
];

function dispositionKey(expected: boolean | null): string {
	if (expected === true) return 'true';
	if (expected === false) return 'false';
	return 'none';
}

const someOfFilter: FilterFn<IssueRule> = (row, columnId, filterValue) => {
	const selected = filterValue as string[] | undefined;
	if (!selected?.length) return true;

	return selected.includes(String(row.getValue(columnId)));
};

const searchFilter: FilterFn<IssueRule> = (row, _columnId, filterValue) => {
	const query = String(filterValue ?? '')
		.trim()
		.toLowerCase();
	if (!query) return true;

	return (row.original.test_name ?? '').toLowerCase().includes(query);
};

function notifyError(err: unknown) {
	const m = getErrorMessage(err);
	return `${m.title}\n${m.description}`;
}

interface RuleToggleProps {
	rule: IssueRule;
	projectId?: number;
}

function RuleToggle({ rule, projectId }: RuleToggleProps) {
	const [activate, activateState] = useActivateRuleMutation();
	const [deactivate, deactivateState] = useDeactivateRuleMutation();
	const isBusy = activateState.isLoading || deactivateState.isLoading;

	function toggleActive() {
		const action = rule.active ? deactivate : activate;
		const promise = action({ ruleId: rule.id, projectId }).unwrap();

		toast.promise(promise, {
			loading: rule.active ? 'Disabling rule...' : 'Enabling rule...',
			success: rule.active ? 'Rule disabled' : 'Rule enabled',
			error: notifyError,
			position: 'top-center'
		});
	}

	return (
		<Tooltip
			content={
				rule.active
					? 'Stops the rule matching future imports. Stamps it already laid down are kept.'
					: 'Applies the rule to future imports. It does not classify runs that already exist — use "Apply rules" on a run for that.'
			}
		>
			<ButtonTw
				variant={rule.active ? 'destruction-secondary' : 'secondary'}
				size="xss"
				state={isBusy ? 'loading' : 'default'}
				onClick={toggleActive}
				data-testid="issue-rule-toggle"
			>
				{rule.active ? 'Disable' : 'Enable'}
			</ButtonTw>
		</Tooltip>
	);
}

interface MatcherDetailProps {
	rule: IssueRule;
}

/**
 * The concrete matcher, which the flag chips only hint at. Every criterion is
 * exact — no operators, no regex — and an empty one is simply ignored.
 */
function MatcherDetail({ rule }: MatcherDetailProps) {
	const parameters = Object.entries(rule.parameters ?? {});
	const sections: { label: string; hint: string; values: string[] }[] = [
		{
			label: 'Parameters',
			hint: 'The result must carry all of these, matched exactly.',
			values: parameters.map(([key, value]) => `${key} = ${value}`)
		},
		{
			label: 'Verdicts',
			hint: 'The result must carry all of these verdicts.',
			values: rule.verdicts ?? []
		},
		{
			label: 'Tags',
			hint: 'Run-level gate — a run missing any of these is skipped entirely.',
			values: rule.tags ?? []
		}
	];

	return (
		<div className="flex flex-col gap-3 px-4 py-3" data-testid="rule-matcher">
			<div className="flex flex-col gap-1">
				<span className="text-[0.6875rem] font-bold tracking-wider uppercase text-text-menu">
					Test
				</span>
				<span className="text-sm font-medium text-text-primary">
					{rule.test_name}
				</span>
			</div>
			{sections.map((section) => (
				<div key={section.label} className="flex flex-col gap-1">
					<Tooltip content={section.hint}>
						<span className="w-fit text-[0.6875rem] font-bold tracking-wider uppercase text-text-menu">
							{section.label}
						</span>
					</Tooltip>
					{section.values.length ? (
						<div className="flex flex-wrap gap-1">
							{section.values.map((value) => (
								<span
									key={value}
									className="px-1.5 py-0.5 text-[0.6875rem] border rounded bg-white border-border-primary"
								>
									{value}
								</span>
							))}
						</div>
					) : (
						<span className="text-xs text-text-menu">
							Not constrained — this criterion is ignored
						</span>
					)}
				</div>
			))}
		</div>
	);
}

function getColumns(projectId?: number): ColumnDef<IssueRule, unknown>[] {
	return [
		{
			id: COLUMN_ID.EXPANDER,
			header: () => null,
			meta: { className: 'w-9' },
			enableSorting: false,
			cell: ({ row }) => (
				<button
					type="button"
					onClick={row.getToggleExpandedHandler()}
					aria-expanded={row.getIsExpanded()}
					aria-label={
						row.getIsExpanded() ? 'Hide matcher' : 'Show what this rule matches'
					}
					className="grid p-1 rounded place-items-center text-text-menu hover:bg-primary-wash hover:text-primary"
					data-testid="issue-rule-expander"
				>
					<Icon
						name="ArrowShortSmall"
						size={18}
						className={cn(
							'transition-transform',
							row.getIsExpanded() ? 'rotate-0' : '-rotate-90'
						)}
					/>
				</button>
			)
		},
		{
			id: COLUMN_ID.TEST,
			accessorFn: (row) => row.test_name,
			header: 'Test',
			filterFn: searchFilter,
			cell: ({ row }) => (
				<span className="font-medium text-text-primary">
					{row.original.test_name}
				</span>
			)
		},
		{
			id: COLUMN_ID.CATEGORY,
			accessorFn: (row) => row.category,
			header: 'Category',
			meta: { className: 'w-44' },
			enableSorting: false,
			filterFn: someOfFilter,
			cell: ({ row }) => {
				const meta = categoryMeta(row.original.category);

				return (
					<Tooltip content={meta.description}>
						<Badge
							className={cn('gap-1', meta.className)}
							data-category={row.original.category}
						>
							<Icon name={meta.iconName} size={14} />
							{meta.label}
						</Badge>
					</Tooltip>
				);
			}
		},
		{
			id: COLUMN_ID.DISPOSITION,
			accessorFn: (row) => dispositionKey(row.expected),
			header: 'Disposition',
			meta: { className: 'w-32' },
			enableSorting: false,
			filterFn: someOfFilter,
			cell: ({ row }) => {
				const badge = expectedBadge(row.original.expected);

				return (
					<Tooltip
						content={
							row.original.expected === true
								? 'Results matching this rule stop counting as unexpected, as long as the issue stays open.'
								: row.original.expected === false
								? 'Results matching this rule are explained but still count as unexpected.'
								: 'This rule only marks results — it changes no count.'
						}
					>
						<Badge variant={badge.variant}>{badge.label}</Badge>
					</Tooltip>
				);
			}
		},
		{
			id: COLUMN_ID.SCOPE,
			header: 'Match scope',
			meta: { className: 'w-64' },
			enableSorting: false,
			cell: ({ row }) => {
				const chips = chipsForFlags({
					matchParameters: row.original.match_parameters,
					matchVerdicts: row.original.match_verdicts,
					matchImportantTags: row.original.match_important_tags,
					matchAllTags: row.original.match_all_tags
				});

				return (
					<div className="flex flex-wrap gap-1">
						{chips.map((chip) => (
							<span
								key={chip}
								className="px-1.5 py-0.5 text-[0.6875rem] rounded bg-primary-wash border border-border-primary"
							>
								{chip}
							</span>
						))}
					</div>
				);
			}
		},
		{
			id: COLUMN_ID.ACTIVE,
			accessorFn: (row) => String(row.active),
			header: 'State',
			meta: { className: 'w-28' },
			enableSorting: false,
			filterFn: someOfFilter,
			cell: ({ row }) => {
				const meta = ruleActiveMeta(row.original.active);

				return (
					<Tooltip content={meta.description}>
						<Badge className={cn('gap-1', meta.className)}>
							<Icon name={meta.iconName} size={14} />
							{meta.label}
						</Badge>
					</Tooltip>
				);
			}
		},
		{
			id: COLUMN_ID.ACTIONS,
			header: () => <span className="sr-only">Actions</span>,
			meta: { className: 'w-28' },
			enableSorting: false,
			cell: ({ row }) => (
				<div className="flex justify-end">
					<RuleToggle rule={row.original} projectId={projectId} />
				</div>
			)
		}
	];
}

const headerClassName =
	'px-4 py-2 font-bold text-[0.6875rem] leading-[0.875rem] tracking-wider text-left uppercase text-text-menu';

const cellClassName =
	'px-4 py-2 text-sm border-t border-b border-transparent first:border-l last:border-r first:rounded-l last:rounded-r group-hover:border-primary group-hover:first:border-primary group-hover:last:border-primary';

export interface IssueRulesTableProps {
	issueId: number;
	projectId?: number;
}

export function IssueRulesTable({ issueId, projectId }: IssueRulesTableProps) {
	const { data, isLoading, error } = useGetIssueRulesQuery({
		projectId,
		issue: issueId
	});

	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [sorting, setSorting] = useState<SortingState>([
		{ id: COLUMN_ID.TEST, desc: false }
	]);

	const rules = useMemo(() => data ?? [], [data]);
	const columns = useMemo(() => getColumns(projectId), [projectId]);

	const facets = useMemo(() => {
		const countBy = (values: string[]) =>
			values.reduce<Record<string, number>>((acc, value) => {
				acc[value] = (acc[value] ?? 0) + 1;
				return acc;
			}, {});

		const categoryCounts = countBy(rules.map((rule) => rule.category));
		const dispositionCounts = countBy(
			rules.map((rule) => dispositionKey(rule.expected))
		);
		const activeCounts = countBy(rules.map((rule) => String(rule.active)));

		return {
			categoryOptions: CATEGORY_ORDER.filter(
				(category) => categoryCounts[category]
			).map((category) => ({
				value: category,
				label: `${categoryMeta(category).label} (${categoryCounts[category]})`
			})),
			dispositionOptions: DISPOSITION_OPTIONS.filter(
				(option) => dispositionCounts[option.value]
			).map((option) => ({
				...option,
				label: `${option.label} (${dispositionCounts[option.value]})`
			})),
			activeOptions: (['true', 'false'] as const)
				.filter((value) => activeCounts[value])
				.map((value) => ({
					value,
					label: `${ruleActiveMeta(value === 'true').label} (${
						activeCounts[value]
					})`
				}))
		};
	}, [rules]);

	const table = useReactTable({
		data: rules,
		columns,
		state: { columnFilters, sorting },
		onColumnFiltersChange: setColumnFilters,
		onSortingChange: setSorting,
		getRowId: (row) => String(row.id),
		getRowCanExpand: () => true,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getExpandedRowModel: getExpandedRowModel()
	});

	const getFilterValue = (columnId: string) =>
		(table.getColumn(columnId)?.getFilterValue() as string[] | undefined) ?? [];

	const search =
		(table.getColumn(COLUMN_ID.TEST)?.getFilterValue() as string | undefined) ??
		'';

	const hasFilters = columnFilters.length > 0;
	const rows = table.getRowModel().rows;

	if (isLoading) {
		return (
			<div className="flex flex-col gap-1 p-2">
				{Array.from({ length: 6 }, () => 0).map((_, idx) => (
					<Skeleton key={idx} className="h-10 rounded-md" />
				))}
			</div>
		);
	}

	if (error) return <BublikErrorState error={error} className="h-[40vh]" />;

	if (!rules.length) {
		return (
			<BublikEmptyState
				title="No rules"
				description="This issue has no rules in the active project. Rules are created by classifying a result, never on their own."
				className="h-[40vh]"
			/>
		);
	}

	return (
		<div className="flex flex-col" data-testid="issue-rules-table">
			<div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-border-primary">
				<Input
					type="text"
					placeholder="Search test"
					className="h-7 min-w-[200px] text-xs"
					value={search}
					onChange={(event) =>
						table
							.getColumn(COLUMN_ID.TEST)
							?.setFilterValue(event.target.value || undefined)
					}
					data-testid="issue-rules-search"
				/>
				<DataTableFacetedFilter
					title="Category"
					size="xss"
					options={facets.categoryOptions}
					value={getFilterValue(COLUMN_ID.CATEGORY)}
					onChange={(values) =>
						table
							.getColumn(COLUMN_ID.CATEGORY)
							?.setFilterValue(values?.length ? values : undefined)
					}
					disabled={!facets.categoryOptions.length}
				/>
				<DataTableFacetedFilter
					title="Disposition"
					size="xss"
					options={facets.dispositionOptions}
					value={getFilterValue(COLUMN_ID.DISPOSITION)}
					onChange={(values) =>
						table
							.getColumn(COLUMN_ID.DISPOSITION)
							?.setFilterValue(values?.length ? values : undefined)
					}
					disabled={!facets.dispositionOptions.length}
				/>
				<DataTableFacetedFilter
					title="State"
					size="xss"
					options={facets.activeOptions}
					value={getFilterValue(COLUMN_ID.ACTIVE)}
					onChange={(values) =>
						table
							.getColumn(COLUMN_ID.ACTIVE)
							?.setFilterValue(values?.length ? values : undefined)
					}
					disabled={!facets.activeOptions.length}
				/>
				{hasFilters ? (
					<Tooltip content="Reset all filters">
						<ButtonTw
							variant="secondary"
							size="xss"
							onClick={() => table.resetColumnFilters()}
							data-testid="issue-rules-reset-filters"
						>
							<Icon name="Bin" size={16} className="mr-1.5" />
							Reset
						</ButtonTw>
					</Tooltip>
				) : null}
				<span className="ml-auto text-xs text-text-menu tabular-nums">
					{rows.length} of {rules.length} rules
				</span>
			</div>

			{rows.length === 0 ? (
				<BublikEmptyState
					title="No matching rules"
					description="No rule matches the current filters."
					className="h-64"
				/>
			) : (
				<div className="px-2 pb-2 overflow-x-auto">
					<table className="min-w-full border-separate border-spacing-y-1">
						<thead>
							{table.getHeaderGroups().map((headerGroup) => (
								<tr key={headerGroup.id} className="h-8.5">
									{headerGroup.headers.map((header) => {
										const canSort = header.column.getCanSort();

										return (
											<th
												key={header.id}
												className={cn(
													headerClassName,
													header.column.columnDef.meta?.className,
													canSort && 'cursor-pointer select-none'
												)}
												onClick={
													canSort
														? header.column.getToggleSortingHandler()
														: undefined
												}
											>
												<span className="inline-flex items-center gap-1">
													{header.isPlaceholder
														? null
														: flexRender(
																header.column.columnDef.header,
																header.getContext()
														  )}
													{canSort ? (
														<TableSort
															sortDescription={header.column.getIsSorted()}
														/>
													) : null}
												</span>
											</th>
										);
									})}
								</tr>
							))}
						</thead>
						<tbody>
							{rows.map((row) => (
								<Fragment key={row.id}>
									<tr
										className="group"
										data-testid="issue-rule-row"
										data-rule-id={row.original.id}
										data-rule-active={row.original.active ? 'true' : 'false'}
									>
										{row.getVisibleCells().map((cell) => (
											<td
												key={cell.id}
												className={cn(
													cellClassName,
													cell.column.columnDef.meta?.className
												)}
											>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext()
												)}
											</td>
										))}
									</tr>
									{row.getIsExpanded() ? (
										<tr>
											<td
												colSpan={row.getVisibleCells().length}
												className="border rounded border-border-primary bg-primary-wash/40"
											>
												<MatcherDetail rule={row.original} />
											</td>
										</tr>
									) : null}
								</Fragment>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
