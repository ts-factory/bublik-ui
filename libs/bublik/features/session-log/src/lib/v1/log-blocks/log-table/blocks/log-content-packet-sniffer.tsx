/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useToggle } from '@/shared/hooks';

import { LogContentSnifferPacket } from '@/shared/types';
import { useSettingsContext } from '../settings.context';
import { cn } from '@/shared/tailwind-ui';

export interface SnifferLineProps {
	label: string;
	content: string[];
}

const SnifferLine = (props: SnifferLineProps) => {
	const [isOpen, toggle] = useToggle(false);

	return (
		<>
			<div className="flex gap-4">
				<button onClick={toggle}>{'-->'}</button>
				<span>{props.label}</span>
			</div>
			{isOpen && props.content.map((content) => <div>{content}</div>)}
		</>
	);
};

export const BlockLogContentPacketSniffer = (
	props: LogContentSnifferPacket
) => {
	const settings = useSettingsContext();

	return (
		<div
			className={cn(
				settings.isWordBreakEnabled
					? 'whitespace-pre-wrap overflow-wrap-anywhere inline'
					: 'whitespace-pre'
			)}
		>
			{props.content.map((line, idx) => (
				<SnifferLine key={idx} {...line} />
			))}
		</div>
	);
};
