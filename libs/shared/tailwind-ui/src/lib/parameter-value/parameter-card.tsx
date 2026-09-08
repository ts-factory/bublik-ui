/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';

import { useCopyToClipboard } from '@/shared/hooks';

import { toast } from '../utils';
import { ButtonTw } from '../button';

export interface ParameterCardProps {
	rawValue: string;
	value: string;
	isSelected?: boolean;
	onClick?: () => void;
}

export const ParameterCard: FC<ParameterCardProps> = ({
	value,
	rawValue,
	isSelected,
	onClick
}) => {
	const [, copy] = useCopyToClipboard();

	return (
		<div className="p-4 bg-white rounded-xl shadow-popover">
			<pre className="mb-2 text-xs whitespace-pre-wrap max-h-96 overflow-auto">
				<code>{value}</code>
			</pre>
			<div className="flex justify-end gap-2">
				{onClick && (
					<ButtonTw
						size="xss"
						variant="secondary"
						className="w-full"
						state={isSelected && 'active'}
						onClick={onClick}
					>
						Select
					</ButtonTw>
				)}
				<ButtonTw
					size={'xss'}
					variant="secondary"
					className="w-full"
					onClick={async () => {
						const isSuccess = await copy(rawValue);
						if (isSuccess)
							toast.success('Copied to clipboard!', {
								style: { top: '110px' }
							});
					}}
				>
					Copy
				</ButtonTw>
			</div>
		</div>
	);
};
