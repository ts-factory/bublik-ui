/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ReactNode } from 'react';
import { useSelector } from 'react-redux';

import {
	BadgeListProps,
	ContextMenu,
	ContextMenuTrigger,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	toast,
	VerdictListProps,
	Icon
} from '@/shared/tailwind-ui';
import { useCopyToClipboard } from '@/shared/hooks';

import {
	useHistoryActions,
	HistoryGlobalFilter,
	selectGlobalFilter
} from '../slice';
import { useHistoryRefresh } from '../hooks';

export interface HistoryContextMenuProps {
	children: ReactNode;
	filterKey: keyof Pick<
		HistoryGlobalFilter,
		'verdicts' | 'parameters' | 'tags'
	>;
	label: string;
	badges: BadgeListProps['badges'];
	resultType?: VerdictListProps['result'];
	isNotExpected?: VerdictListProps['isNotExpected'];
	hash?: string;
}

export const HistoryContextMenuContainer = (props: HistoryContextMenuProps) => {
	const { filterKey, label, badges, children } = props;
	const actions = useHistoryActions();
	const globalFilter = useSelector(selectGlobalFilter);
	const [, copy] = useCopyToClipboard();

	const refresh = useHistoryRefresh();

	const applyGlobalFilter = (
		updatedGlobalFilter: Partial<HistoryGlobalFilter>
	) => {
		actions.updateLinearGlobalFilter({
			...globalFilter,
			...updatedGlobalFilter
		});
		refresh({ ...globalFilter, ...updatedGlobalFilter });
	};

	const handleResultType = () => {
		if (
			typeof props.resultType === 'undefined' ||
			typeof props.isNotExpected === 'undefined'
		) {
			return;
		}

		if (
			props.resultType === globalFilter.resultType &&
			props.isNotExpected === globalFilter.isNotExpected
		) {
			return applyGlobalFilter({ resultType: null, isNotExpected: null });
		}

		applyGlobalFilter({
			resultType: props.resultType,
			isNotExpected: props.isNotExpected
		});
	};

	const handleSelectAll = () => {
		const currentFilterValue = globalFilter[filterKey];
		const tags = badges.map((badge) => badge.payload);

		const newTags = Array.from(new Set([...currentFilterValue, ...tags]));

		if (tags.every((tag) => currentFilterValue.includes(tag))) {
			const unselectedTags = currentFilterValue.filter(
				(tag) => !tags.includes(tag)
			);

			return applyGlobalFilter({ [filterKey]: unselectedTags });
		}

		applyGlobalFilter({ [filterKey]: newTags });
	};

	const handleSelectImportant = () => {
		const importantTags = badges
			.filter((badge) => badge.isImportant)
			.map((badge) => badge.payload);

		const currentFilterValue = globalFilter[filterKey];

		if (importantTags.every((tag) => currentFilterValue.includes(tag))) {
			const unselectedImportantTags = currentFilterValue.filter(
				(tag) => !importantTags.includes(tag)
			);

			return applyGlobalFilter({ tags: unselectedImportantTags });
		}

		const selectedImportant = Array.from(
			new Set([...currentFilterValue, ...importantTags])
		);

		applyGlobalFilter({ tags: selectedImportant });
	};

	const handleCopyAll = async () => {
		const rawBadges = badges.map((badge) => badge.payload).join(', ');

		const isSuccess = await copy(rawBadges);

		if (!isSuccess) toast.error('Failed to copy to clipboard');

		toast.success(`Copied ${label} to clipboard`);
	};

	const handleCopyHash = () => {
		if (!props.hash) return;

		const isSuccess = copy(props.hash);

		if (!isSuccess) toast.error('Failed to copy to clipboard');

		toast.success('Copied hash to clipboard');
	};

	const hasResult =
		typeof props.resultType !== 'undefined' &&
		typeof props.isNotExpected !== 'undefined';

	return (
		<ContextMenu>
			<ContextMenuTrigger>{children}</ContextMenuTrigger>
			<ContextMenuContent>
				{badges.some((badge) => badge.isImportant) && (
					<>
						<ContextMenuItem
							label="Select important"
							onSelect={handleSelectImportant}
							icon={<Icon name="Scan" size={16} />}
						/>
						<ContextMenuSeparator />
					</>
				)}
				{hasResult && (
					<>
						<ContextMenuItem
							label="Select result"
							onSelect={handleResultType}
							icon={<Icon name="InformationCircleExclamationMark" size={16} />}
						/>
						<ContextMenuSeparator />
					</>
				)}
				<ContextMenuItem
					label={`Select ${label}`}
					onSelect={handleSelectAll}
					icon={<Icon name="ExpandSelection" size={16} />}
				/>
				<ContextMenuSeparator />
				<ContextMenuItem
					label={`Copy ${label}`}
					onSelect={handleCopyAll}
					icon={<Icon name="Paper" size={16} />}
				/>
				{props.hash && (
					<ContextMenuItem
						label="Copy hash"
						onSelect={handleCopyHash}
						icon={<Icon name="Paper" size={16} />}
					/>
				)}
			</ContextMenuContent>
		</ContextMenu>
	);
};
