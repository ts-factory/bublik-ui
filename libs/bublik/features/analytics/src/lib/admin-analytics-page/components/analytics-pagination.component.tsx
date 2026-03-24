/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ButtonTw, Icon } from '@/shared/tailwind-ui';

interface AnalyticsPaginationProps {
	currentPage: number;
	totalPages: number;
	pageSize: number;
	pageSizeOptions: readonly number[];
	onPageChange: (page: number) => void;
	onPageSizeChange: (pageSize: number) => void;
}

function AnalyticsPagination(props: AnalyticsPaginationProps) {
	const {
		currentPage,
		totalPages,
		pageSize,
		pageSizeOptions,
		onPageChange,
		onPageSizeChange
	} = props;

	return (
		<div className="px-4 py-2 flex items-center justify-between gap-3">
			<div className="text-sm text-text-secondary shrink-0">
				Page {currentPage} of {totalPages}
			</div>
			<div className="flex items-center gap-2 ml-auto">
				<div className="flex items-center gap-2">
					<label
						htmlFor="analytics-page-size"
						className="text-sm text-text-secondary"
					>
						Page size
					</label>
					<div className="relative">
						<select
							id="analytics-page-size"
							value={`${pageSize}`}
							onChange={(event) => onPageSizeChange(Number(event.target.value))}
							className="inline-flex border-border-primary max-h-[26px] min-w-[64px] appearance-none items-center justify-center rounded-md py-1.5 pl-2 pr-6 text-[0.6875rem] font-semibold leading-[0.875rem] transition-all hover:border-primary"
						>
							{pageSizeOptions.map((option) => (
								<option key={option} value={option}>
									{option}
								</option>
							))}
						</select>
					</div>
				</div>
				<ButtonTw
					variant="secondary"
					size="xss"
					onClick={() => onPageChange(currentPage - 1)}
					disabled={currentPage <= 1}
				>
					Prev
				</ButtonTw>
				<ButtonTw
					variant="secondary"
					size="xss"
					onClick={() => onPageChange(currentPage + 1)}
					disabled={currentPage >= totalPages}
				>
					Next
				</ButtonTw>
			</div>
		</div>
	);
}

export { AnalyticsPagination };
