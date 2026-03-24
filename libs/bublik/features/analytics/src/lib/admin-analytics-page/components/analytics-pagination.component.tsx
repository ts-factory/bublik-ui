/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ButtonTw } from '@/shared/tailwind-ui';

interface AnalyticsPaginationProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
}

function AnalyticsPagination(props: AnalyticsPaginationProps) {
	const { currentPage, totalPages, onPageChange } = props;

	return (
		<div className="px-4 py-1 flex items-center justify-between">
			<div className="text-sm text-text-secondary">
				Page {currentPage} of {totalPages}
			</div>
			<div className="flex items-center gap-2">
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
