/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	ComponentPropsWithRef,
	CSSProperties,
	FC,
	memo,
	SVGProps,
	forwardRef
} from 'react';

import { NodeEntityValue, NodeEntity } from '@/shared/types';
import { Tooltip, cn, Icon } from '@/shared/tailwind-ui';

const SkippedIcon = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
	(props, ref) => (
		<svg
			width={16}
			height={16}
			fill="none"
			viewBox="0 0 16 16"
			xmlns="http://www.w3.org/2000/svg"
			ref={ref}
			{...props}
		>
			<path
				d="M8 2a6.006 6.006 0 0 0-5.931 6.911.437.437 0 0 0 .862-.132A5.134 5.134 0 0 1 8 2.872c2.827 0 5.128 2.3 5.128 5.128 0 2.828-2.3 5.128-5.128 5.128a5.096 5.096 0 0 1-4.065-2.002.436.436 0 1 0-.691.533A5.964 5.964 0 0 0 8 14c3.308 0 6-2.692 6-6 0-3.309-2.692-6-6-6"
				fill="currentColor"
			/>
			<path
				d="m2.069 8.911.099-.015-.099.015Zm.497.365-.015-.099h-.002l.017.1Zm.365-.497.099-.015-.099.015Zm1.004 2.347.08-.061h-.001l-.079.061Zm-.611-.08.06.08-.06-.08Zm-.08.613-.08.06.08-.06ZM8 1.9A6.106 6.106 0 0 0 1.9 8h.2c0-3.254 2.647-5.9 5.9-5.9v-.2ZM1.9 8c0 .311.024.623.07.927l.198-.03A5.961 5.961 0 0 1 2.1 8h-.2Zm.07.926a.532.532 0 0 0 .612.449l-.033-.197a.332.332 0 0 1-.381-.282l-.198.03Zm.611.45a.537.537 0 0 0 .449-.612l-.198.03a.337.337 0 0 1-.281.383l.03.198Zm.449-.612A5.07 5.07 0 0 1 2.972 8h-.2c0 .268.02.534.06.795l.198-.03ZM2.972 8A5.034 5.034 0 0 1 8 2.972v-.2A5.234 5.234 0 0 0 2.772 8h.2ZM8 2.972A5.034 5.034 0 0 1 13.028 8h.2A5.234 5.234 0 0 0 8 2.772v.2ZM13.028 8A5.033 5.033 0 0 1 8 13.028v.2A5.233 5.233 0 0 0 13.228 8h-.2ZM8 13.028a4.996 4.996 0 0 1-3.986-1.963l-.158.122A5.196 5.196 0 0 0 8 13.227v-.2Zm-3.986-1.963a.536.536 0 0 0-.752-.097l.123.158a.336.336 0 0 1 .471.061l.158-.122Zm-.751-.098a.536.536 0 0 0-.099.753l.16-.122a.336.336 0 0 1 .06-.472l-.121-.159Zm-.098.753A6.064 6.064 0 0 0 8 14.1v-.2c-1.845 0-3.55-.84-4.677-2.302l-.158.122ZM8 14.1c3.364 0 6.1-2.736 6.1-6.1h-.2c0 3.253-2.647 5.9-5.9 5.9v.2ZM14.1 8c0-3.364-2.736-6.1-6.1-6.1v.2c3.253 0 5.9 2.646 5.9 5.9h.2ZM10.094 6.344l-.828.234a1.539 1.539 0 0 0-.23-.402 1.119 1.119 0 0 0-.407-.328c-.172-.086-.392-.13-.66-.13-.367 0-.673.085-.918.255-.242.166-.364.379-.364.636 0 .23.084.41.25.543.167.133.428.244.782.332l.89.22c.537.13.937.329 1.2.597.263.265.394.608.394 1.027 0 .344-.099.651-.297.922-.195.27-.469.484-.82.64-.352.157-.76.235-1.227.235-.612 0-1.118-.133-1.52-.398-.4-.266-.654-.654-.76-1.165l.874-.218c.083.323.241.565.473.726.234.162.54.242.918.242.43 0 .77-.09 1.023-.273.255-.185.383-.406.383-.664a.698.698 0 0 0-.219-.523c-.146-.144-.37-.25-.672-.32l-1-.235c-.55-.13-.953-.332-1.21-.606-.256-.276-.383-.62-.383-1.035 0-.338.095-.638.285-.898.192-.26.454-.465.785-.613.333-.149.71-.223 1.133-.223.593 0 1.06.13 1.398.39.341.26.584.605.727 1.032Z"
				fill="currentColor"
			/>
		</svg>
	)
);

const getIcon = (entity: NodeEntityValue | NodeEntity) => {
	switch (entity) {
		case NodeEntity.Package:
			return <Icon name="Folder" className="flex-shrink-0" />;
		case NodeEntity.Session:
			return <Icon name="Folder" className="flex-shrink-0" />;
		case NodeEntity.Test:
			return <Icon name="Paper" size={16} className="flex-shrink-0" />;
		case NodeEntity.Suite:
			return <Icon name="PaperStack" size={16} className="flex-shrink-0" />;
		default:
			return <Icon name="Paper" size={16} className="flex-shrink-0" />;
	}
};

const focused = { backgroundColor: '#f7faff', color: '#627efb' };
const scrolled = { backgroundColor: 'white', borderColor: '#627efb' };

export interface TreeItemProps extends ComponentPropsWithRef<'div'> {
	entity: NodeEntityValue | NodeEntity;
	label: string;
	isOpen: boolean;
	isFocused: boolean;
	isScrolled: boolean;
	isShowingRunLog: boolean;
	hasError: boolean;
	path?: string | null;
	paddingStyle: CSSProperties;
	isRoot: boolean;
	isSkipped?: boolean;
}

export const TreeItem: FC<TreeItemProps> = memo((props) => {
	const {
		entity,
		label,
		isOpen,
		isFocused,
		isScrolled,
		isShowingRunLog,
		onClick,
		hasError,
		style,
		paddingStyle,
		path,
		isSkipped,
		isRoot
	} = props;

	const isTest = entity === NodeEntity.Test;
	const isSuite = entity === NodeEntity.Suite;
	const isDisabled = isSuite || isRoot;
	const isFocus = isFocused && !isShowingRunLog;
	const isScroll = isScrolled && !isShowingRunLog;

	const tooltipPath = path || '';

	const arrowStyles = {
		opacity: isRoot ? 0 : 1,
		transform: !isOpen ? 'rotate(-90deg)' : undefined
	};

	let selectStyles: CSSProperties = {};
	if (isFocus) selectStyles = focused;
	if (isScroll) selectStyles = scrolled;
	if (isFocus && isScroll) selectStyles = { ...focused, ...scrolled };

	return (
		<div className="flex items-center py-0.5" style={style}>
			<Tooltip content={tooltipPath} side="bottom" disabled={isDisabled}>
				<div
					className={cn(
						'flex items-center justify-center w-full h-full min-w-0 mx-4 rounded cursor-pointer border border-transparent bg-[#d7dbe4c] hover:border-primary hover:bg-white active:bg-[#f8f8fa] active:text-primary',
						isFocus && 'text-primary bg-primary-wash',
						isScroll && 'bg-white border-primary'
					)}
					style={selectStyles}
					onClick={onClick}
				>
					<div className="w-full h-full" style={paddingStyle}>
						<div className="flex items-center h-full min-w-0 gap-1 pr-1">
							{!isTest && (
								<Icon
									name="ArrowShortSmall"
									style={arrowStyles}
									className="flex-shrink-0"
								/>
							)}
							{getIcon(entity)}
							<span className="h-full font-medium text-[0.875rem] truncate">
								{label}
							</span>
							<div className="flex items-center flex-shrink-0">
								{hasError && (
									<Icon
										name="InformationCircleExclamationMark"
										className="flex-shrink-0 text-text-unexpected"
										size={16}
									/>
								)}
								{isSkipped && (
									<SkippedIcon className="flex-shrink-0 text-text-expected" />
								)}
							</div>
						</div>
					</div>
				</div>
			</Tooltip>
		</div>
	);
});
