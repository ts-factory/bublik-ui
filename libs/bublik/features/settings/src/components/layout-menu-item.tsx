/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { PanelLeft } from 'lucide-react';

import { PAGE_LAYOUTS, usePageLayout } from '@/shared/hooks';

import { LAYOUT_OPTIONS } from './layout-options';
import { TrayMenuItem } from './tray-menu-item';

interface LayoutMenuItemProps {
	itemClassName: string;
	onOpenSettings: () => void;
}

const LAYOUT_TRAY_OPTIONS = PAGE_LAYOUTS.map((value) => ({
	value,
	...LAYOUT_OPTIONS[value]
}));

/**
 * The Layout entry of the account menu: the entry opens the Appearance
 * settings, where the layout is chosen too, and its tray switches the layout
 * in place
 */
function LayoutMenuItem({
	itemClassName,
	onOpenSettings
}: LayoutMenuItemProps) {
	const { layout, setLayout } = usePageLayout();

	return (
		<TrayMenuItem
			icon={<PanelLeft className="size-[18px]" />}
			label="Layout"
			itemClassName={itemClassName}
			onOpenSettings={onOpenSettings}
			ariaLabel="Layout"
			value={layout}
			onValueChange={setLayout}
			options={LAYOUT_TRAY_OPTIONS}
			testIdPrefix="account-menu-layout"
		/>
	);
}

export { LayoutMenuItem };
