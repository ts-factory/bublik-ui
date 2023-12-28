/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Icon } from '@/shared/tailwind-ui';

export interface CellNoteProps {
	bugId?: string;
	bugUrl?: string;
	comment?: string;
	isAdmin: boolean;
	onDeleteClick?: () => void;
}

export const CellNote = (props: CellNoteProps) => {
	const { bugId, bugUrl, onDeleteClick, isAdmin, comment } = props;

	return (
		<>
			<div className="flex items-center gap-4 justify-between">
				<h2 className="text-xs text-text-secondary">Note</h2>
				<div className="flex items-center gap-1">
					{isAdmin ? (
						<button
							aria-label="Remove compromised status"
							className="p-1 transition-colors rounded-md hover:bg-primary-wash text-text-unexpected hover:bg-bg-error/10"
							onClick={onDeleteClick}
						>
							<Icon name="Bin" size={16} />
						</button>
					) : null}
				</div>
			</div>
			<p className="text-text-menu break-words">{comment}</p>
			<div>
				<a
					href={bugUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="text-xs rounded-md text-primary bg-primary-wash px-1 py-0.5 hover:underline"
				>
					Bug: {bugId}
				</a>
			</div>
		</>
	);
};
