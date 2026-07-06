/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ProjectPickerContainer } from '@/bublik/features/projects';
import { SettingsModal } from '@/bublik/features/settings';
import { DashboardSidebarNav } from '@/bublik/features/dashboard-v2';
import { RunsSidebarNav } from '@/bublik/features/runs';
import { RunSidebarNav } from '@/bublik/features/run';
import { LogSidebarNav } from '@/bublik/features/log';
import { HistorySidebarNav } from '@/bublik/features/history';
import { MeasurementsSidebarNav } from '@/bublik/features/measurements';
import { AdminSidebarNav } from '@/bublik/features/admin-users';
import { HelpSidebarNav } from '@/bublik/features/faq';
import { Sidebar } from '@/bublik/features/sidebar';

function FooterNav() {
	return (
		<>
			<SettingsModal />
			<AdminSidebarNav />
			<HelpSidebarNav />
		</>
	);
}

export function SidebarContainer() {
	return (
		<Sidebar headerSlot={<ProjectPickerContainer />} footerSlot={<FooterNav />}>
			<DashboardSidebarNav />
			<RunsSidebarNav />
			<RunSidebarNav />
			<LogSidebarNav />
			<HistorySidebarNav />
			<MeasurementsSidebarNav />
		</Sidebar>
	);
}
