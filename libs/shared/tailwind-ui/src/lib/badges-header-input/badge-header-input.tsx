/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useRef, useState, KeyboardEvent, useEffect, forwardRef } from 'react';
import { mergeRefs } from '@react-aria/utils';

import { useHorizontalScroll } from '@/shared/hooks';

import { Icon } from '../icon';

export interface BadgesHeaderInputProps {
	value: string[];
	onChange: (newBadges: string[]) => void;
}

export const BadgesHeaderInput = forwardRef<
	HTMLDivElement,
	BadgesHeaderInputProps
>(({ value, onChange }, ref) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const [input, setInput] = useState('');
	const [isInputShown, setIsInputShown] = useState(false);
	const [isPlaceholderShown, setShowPlaceholder] = useState(!value.length);
	const [isAddButtonShown, setIsAddShown] = useState(false);
	const { scrollRef } = useHorizontalScroll();

	const handleAddClick = () => {
		setIsInputShown(true);
		setShowPlaceholder(false);

		setTimeout(() => {
			if (inputRef.current) inputRef.current.focus();
		}, 0);
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key !== 'Enter') return;

		const addValue = Array.from(new Set([...value, input].filter(Boolean)));

		if (!addValue.length) {
			setShowPlaceholder(true);
		} else {
			setInput('');
			onChange(addValue);
		}

		setIsInputShown(false);
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const handleClickOutside = (event: any) => {
		if (containerRef.current && !containerRef.current.contains(event.target)) {
			setIsInputShown(false);
			setInput('');
			setShowPlaceholder(!value.length);
		}
	};

	useEffect(() => {
		document.addEventListener('click', handleClickOutside, true);
		return () => {
			document.removeEventListener('click', handleClickOutside, true);
		};
	});

	const handleBadgeClick = (badgeValue: string) => {
		const filteredBadges = value.filter((badgeStr) => badgeStr !== badgeValue);
		setIsInputShown(true);
		setInput(badgeValue);

		onChange?.(filteredBadges);

		setTimeout(() => {
			if (inputRef.current) inputRef.current.focus();
		}, 0);
	};

	return (
		<div
			data-testid="badge-header-input"
			onKeyDown={handleKeyDown}
			onMouseEnter={() => setIsAddShown(true)}
			onMouseLeave={() => setIsAddShown(false)}
			onClick={handleClickOutside}
			ref={mergeRefs(containerRef, ref)}
		>
			<div className="flex items-center justify-center py-1.5 px-3 border border-border-primary rounded-md">
				<div className="flex items-center gap-2">
					<Icon
						name="Filter"
						size={24}
						className={value.length ? 'text-primary' : 'text-border-primary'}
					/>
					{isPlaceholderShown && (
						<span className="text-[0.875rem] font-medium leading-[1.5rem]">
							Tags
						</span>
					)}
					<div
						className="flex max-w-[200px] overflow-scroll disable-scrollbar gap-2"
						ref={scrollRef}
					>
						{value.map((badgeString) => (
							<button
								key={badgeString}
								className="inline-flex items-center py-0.5 px-2 rounded border border-transparent text-[0.75rem] font-medium bg-badge-9 whitespace-nowrap"
								onClick={() => handleBadgeClick(badgeString)}
							>
								<span className="text-[0.6875rem leading-[0.875rem]">
									{badgeString}
								</span>
							</button>
						))}
						{isInputShown && (
							<input
								className="bg-transparent outline-none text-[0.6875rem] leading-[0.875rem]"
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onFocus={() => setShowPlaceholder(false)}
								ref={inputRef}
							/>
						)}
					</div>

					{isAddButtonShown && (
						<button
							type="button"
							className="flex items-center justify-center"
							onClick={handleAddClick}
						>
							<Icon name="AddSymbol" />
						</button>
					)}
				</div>
			</div>
		</div>
	);
});
