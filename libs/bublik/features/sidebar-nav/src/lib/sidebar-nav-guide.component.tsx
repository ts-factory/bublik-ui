/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { cn } from '@/shared/tailwind-ui';

const GUIDE_X = 30;
const GUIDE_END_X = 53;
const GUIDE_TOP = -7;
const FIRST_ITEM_CENTER_Y = 18;
const ITEM_STEP_Y = 48;
const CORNER_RADIUS = 10;

interface SidebarNavGuideProps {
	itemCount: number;
	activeIndex: number | null;
	isActiveItemDisabled: boolean;
	isGroupActive: boolean;
	isVisible: boolean;
}

function getItemCenterY(index: number): number {
	return FIRST_ITEM_CENTER_Y + index * ITEM_STEP_Y;
}

function getConnectorPath(centerY: number): string {
	return `M ${GUIDE_X} ${centerY - CORNER_RADIUS} ${getConnectorCurve(
		centerY
	)}`;
}

function getConnectorCurve(centerY: number): string {
	return `Q ${GUIDE_X} ${centerY} ${
		GUIDE_X + CORNER_RADIUS
	} ${centerY} H ${GUIDE_END_X}`;
}

function getTreePath(itemCount: number): string {
	if (itemCount === 0) return '';

	const lastCenterY = getItemCenterY(itemCount - 1);
	const connectors = Array.from({ length: itemCount }, (_, index) =>
		getConnectorPath(getItemCenterY(index))
	).join(' ');

	return `M ${GUIDE_X} ${GUIDE_TOP} V ${
		lastCenterY - CORNER_RADIUS
	} ${connectors}`;
}

function getActivePath(
	activeIndex: number | null,
	isActiveItemDisabled: boolean,
	isGroupActive: boolean
): string {
	if (activeIndex === null) {
		return isGroupActive ? `M ${GUIDE_X} ${GUIDE_TOP} V 0` : '';
	}

	const centerY = getItemCenterY(activeIndex);
	if (isActiveItemDisabled) {
		const itemTop = activeIndex === 0 ? 0 : centerY - 30;
		return `M ${GUIDE_X} ${GUIDE_TOP} V ${itemTop}`;
	}

	return `M ${GUIDE_X} ${GUIDE_TOP} V ${
		centerY - CORNER_RADIUS
	} ${getConnectorCurve(centerY)}`;
}

function SidebarNavGuide({
	itemCount,
	activeIndex,
	isActiveItemDisabled,
	isGroupActive,
	isVisible
}: SidebarNavGuideProps) {
	if (itemCount === 0) return null;

	const height = getItemCenterY(itemCount - 1) + FIRST_ITEM_CENTER_Y;
	const pathProps = {
		fill: 'none',
		strokeWidth: 2,
		strokeLinecap: 'round' as const,
		strokeLinejoin: 'round' as const,
		vectorEffect: 'non-scaling-stroke' as const
	};

	return (
		<div
			aria-hidden="true"
			data-sidebar-nav-guide
			className={cn(
				'pointer-events-none absolute -top-2 bottom-0 left-0 z-10 overflow-hidden transition-opacity duration-300',
				isVisible ? 'opacity-100 delay-700' : 'opacity-0 delay-0'
			)}
		>
			<svg
				width={GUIDE_END_X + 1}
				height={height + 8}
				viewBox={`0 -8 ${GUIDE_END_X + 1} ${height + 8}`}
				className="block overflow-visible"
			>
				<path
					data-sidebar-nav-guide-default
					d={getTreePath(itemCount)}
					className="stroke-border-primary"
					{...pathProps}
				/>
				<path
					data-sidebar-nav-guide-active
					d={getActivePath(activeIndex, isActiveItemDisabled, isGroupActive)}
					className="stroke-primary"
					{...pathProps}
				/>
			</svg>
		</div>
	);
}

export { SidebarNavGuide, type SidebarNavGuideProps };
