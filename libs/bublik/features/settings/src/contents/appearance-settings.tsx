/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';

import { THEMES, type Theme, useTheme } from '@/shared/hooks';
import { cn } from '@/shared/tailwind-ui';

import { SettingsPane } from '../components/settings-pane';
import { SettingsSection } from '../components/settings-section';
import { THEME_OPTIONS } from '../components/theme-options';
import { SystemMock, ThemeMock } from '../components/theme-preview';

export function AppearanceSettingsContent() {
	const { theme, resolvedTheme, setTheme } = useTheme();

	return (
		<SettingsPane
			header="Appearance"
			description="Customize how the application looks"
		>
			<SettingsSection title="Theme" description="Saved in this browser.">
				<RadioGroupPrimitive.Root
					aria-label="Theme"
					value={theme}
					onValueChange={(value) => setTheme(value as Theme)}
					className="grid grid-cols-1 gap-3 sm:grid-cols-3"
				>
					{THEMES.map((value) => {
						const {
							label,
							description,
							icon: OptionIcon
						} = THEME_OPTIONS[value];
						const isActive = theme === value;

						return (
							<RadioGroupPrimitive.Item
								key={value}
								value={value}
								id={`theme-${value}`}
								aria-label={label}
								className={cn(
									'flex flex-col overflow-hidden rounded-lg border text-left transition-colors',
									'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
									isActive
										? 'border-primary'
										: 'border-border-input hover:border-primary/60'
								)}
							>
								<div
									className={cn(
										'flex items-center gap-2 border-b px-3 py-2',
										isActive
											? 'border-primary bg-primary-wash'
											: 'border-border-primary'
									)}
								>
									<OptionIcon
										className="size-4 shrink-0 text-text-menu"
										strokeWidth={1.6}
									/>
									<span className="text-sm font-semibold text-text-primary">
										{label}
									</span>
									{isActive ? (
										<span className="ml-auto rounded-full border border-primary px-2 text-xs font-medium leading-5 text-primary">
											Active
										</span>
									) : null}
								</div>
								<div className="flex flex-1 flex-col gap-2 p-3">
									<p className="text-xs leading-4 text-text-menu">
										{description}
										{value === 'system' ? ` · now ${resolvedTheme}` : ''}
									</p>
									<div className="mt-auto overflow-hidden rounded-md border border-border-primary">
										{value === 'system' ? (
											<SystemMock className="aspect-[4/3]" />
										) : (
											<ThemeMock theme={value} className="aspect-[4/3]" />
										)}
									</div>
								</div>
							</RadioGroupPrimitive.Item>
						);
					})}
				</RadioGroupPrimitive.Root>
			</SettingsSection>
		</SettingsPane>
	);
}
