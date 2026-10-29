/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';

import {
	PAGE_LAYOUTS,
	type PageLayout,
	THEMES,
	type Theme,
	usePageLayout,
	useTheme
} from '@/shared/hooks';

import { LAYOUT_OPTIONS } from '../components/layout-options';
import { LayoutMock } from '../components/layout-preview';
import { RadioCard } from '../components/radio-card';
import { SettingsPane } from '../components/settings-pane';
import { SettingsSection } from '../components/settings-section';
import { THEME_OPTIONS } from '../components/theme-options';
import { SystemMock, ThemeMock } from '../components/theme-preview';

function ThemeSettings() {
	const { theme, resolvedTheme, setTheme } = useTheme();

	return (
		<SettingsSection title="Theme" description="Saved in this browser.">
			<RadioGroupPrimitive.Root
				aria-label="Theme"
				value={theme}
				onValueChange={(value) => setTheme(value as Theme)}
				className="grid grid-cols-1 gap-3 sm:grid-cols-3"
			>
				{THEMES.map((value) => {
					const { label, description, icon } = THEME_OPTIONS[value];

					return (
						<RadioCard
							key={value}
							value={value}
							id={`theme-${value}`}
							label={label}
							description={
								value === 'system'
									? `${description} · now ${resolvedTheme}`
									: description
							}
							icon={icon}
							isActive={theme === value}
							preview={
								value === 'system' ? (
									<SystemMock className="aspect-[4/3]" />
								) : (
									<ThemeMock theme={value} className="aspect-[4/3]" />
								)
							}
						/>
					);
				})}
			</RadioGroupPrimitive.Root>
		</SettingsSection>
	);
}

function LayoutSettings() {
	const { layout, setLayout } = usePageLayout();

	return (
		<SettingsSection
			title="Layout"
			description="Saved in this browser. Has an effect on screens wider than 1920px."
		>
			<RadioGroupPrimitive.Root
				aria-label="Layout"
				value={layout}
				onValueChange={(value) => setLayout(value as PageLayout)}
				className="grid grid-cols-1 gap-3 sm:grid-cols-3"
			>
				{PAGE_LAYOUTS.map((value) => {
					const { label, description, icon } = LAYOUT_OPTIONS[value];

					return (
						<RadioCard
							key={value}
							value={value}
							id={`layout-${value}`}
							label={label}
							description={description}
							icon={icon}
							isActive={layout === value}
							preview={<LayoutMock layout={value} className="aspect-[2/1]" />}
						/>
					);
				})}
			</RadioGroupPrimitive.Root>
		</SettingsSection>
	);
}

export function AppearanceSettingsContent() {
	return (
		<SettingsPane
			header="Appearance"
			description="Customize how the application looks"
		>
			<ThemeSettings />
			<LayoutSettings />
		</SettingsPane>
	);
}
