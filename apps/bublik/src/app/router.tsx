/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	Navigate,
	Outlet,
	createBrowserRouter,
	RouterProvider,
	useNavigate
} from 'react-router-dom';
import { QueryParamProvider } from 'use-query-params';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';

import { config } from '@/bublik/config';
import { ErrorBoundary } from '@/shared/tailwind-ui';
import { PrivateRoute } from '@/bublik/features/auth';

import {
	DevelopersLayout,
	FlowerFeature,
	ImportPage,
	NoMatchFeature,
	LogPage,
	RunPage,
	MeasurementsPage,
	HelpPage,
	RunsPage,
	RunDiffPage,
	ChangelogPage,
	HistoryPageV2,
	LoginPage,
	SettingsProfilePage,
	SettingsAppearancePage,
	ForgotPage,
	SettingsLayout,
	AuthLayout,
	ResetPasswordPage,
	AdminUsersPage,
	DashboardPageV2,
	EmailActivationPage,
	RunReportPage,
	ConfigsPage
} from '../pages';
import { Layout } from './layout';
import { RedirectToLogPage } from './redirects';
import { PerformancePage } from '../pages/performance-page';

import { useEffect, useState } from 'react';
import { CopyShortUrlCommandItemContainer } from '@/bublik/features/copy-url';
import {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	Icon
} from '@/shared/tailwind-ui';

function BublikCommand() {
	const [open, setOpen] = useState(false);
	const navigate = useNavigate();

	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((open) => !open);
			}
		};

		document.addEventListener('keydown', down);
		return () => document.removeEventListener('keydown', down);
	}, []);

	function handleSelect(action: () => void) {
		return (_value: string) => {
			action();
			setOpen(false);
		};
	}

	return (
		<CommandDialog open={open} onOpenChange={setOpen}>
			<Command className="border rounded-lg shadow-xl">
				<CommandInput
					startIcon={
						<Icon name="MagnifyingGlass" className="size-5 text-text-menu" />
					}
					placeholder="Type a command or search..."
				/>
				<CommandList>
					<CommandEmpty>No results found.</CommandEmpty>
					<CommandGroup heading="Navigation">
						<CommandItem onSelect={handleSelect(() => navigate('/dashboard'))}>
							<Icon name="Category" className="w-4 h-4 mr-2" />
							<span>Dashboard</span>
						</CommandItem>
						<CommandItem onSelect={handleSelect(() => navigate('/history'))}>
							<Icon name="TimeCircle" className="w-4 h-4 mr-2" />
							<span>History</span>
						</CommandItem>
						<CommandItem onSelect={handleSelect(() => navigate('/runs'))}>
							<Icon name="Play" className="w-4 h-4 mr-2" />
							<span>Runs</span>
						</CommandItem>
					</CommandGroup>
					<CommandSeparator />
					<CommandGroup heading="Settings">
						<CommandItem
							onSelect={handleSelect(() => navigate('/settings/profile'))}
						>
							<Icon name="Profile" className="w-4 h-4 mr-2" />
							<span>Profile</span>
						</CommandItem>
						<CommandItem onSelect={handleSelect(() => navigate('/help/faq'))}>
							<Icon name="Bulb" className="w-4 h-4 mr-2" />
							<span>Help</span>
						</CommandItem>
						<CommandItem
							onSelect={handleSelect(() => navigate('/help/changelog'))}
						>
							<Icon name="PaperChangelog" className="w-4 h-4 mr-2" />
							<span>Changelog</span>
						</CommandItem>
					</CommandGroup>
					<CommandGroup heading="Utils">
						<CopyShortUrlCommandItemContainer
							onComplete={() => setOpen(false)}
						/>
					</CommandGroup>
				</CommandList>
			</Command>
		</CommandDialog>
	);
}

const router = createBrowserRouter(
	[
		{
			element: (
				<QueryParamProvider
					adapter={ReactRouter6Adapter}
					options={{ updateType: 'replaceIn' }}
				>
					<BublikCommand />
					<Outlet />
				</QueryParamProvider>
			),
			ErrorBoundary: () => <ErrorBoundary />,
			children: [
				{
					path: 'auth',
					element: (
						<AuthLayout>
							<Outlet />
						</AuthLayout>
					),
					children: [
						{ path: 'login', element: <LoginPage /> },
						{ path: 'forgot', element: <ForgotPage /> },
						{
							path: 'forgot_password/password_reset/:userId/:resetToken',
							element: <ResetPasswordPage />
						},
						{
							path: 'register/activate/:userId/:token/',
							element: <EmailActivationPage />
						}
					]
				},
				{
					element: (
						<Layout>
							<Outlet />
						</Layout>
					),
					ErrorBoundary: () => <ErrorBoundary />,
					children: [
						{ path: '/', element: <Navigate to="/dashboard" /> },
						{ path: '/dashboard', element: <DashboardPageV2 /> },
						{ path: '/history', element: <HistoryPageV2 /> },
						{ path: '/history/v2', element: <HistoryPageV2 /> },
						{ path: '/log/:runId/:old', element: <RedirectToLogPage /> },
						{ path: '/log/:runId', element: <LogPage /> },
						{
							path: '/runs/:runId/report',
							element: <RunReportPage />
						},
						{
							path: '/runs/:runId/results/:resultId/measurements',
							element: <MeasurementsPage />
						},
						{ path: '/runs', element: <RunsPage /> },
						{ path: '/compare', element: <RunDiffPage /> },
						{
							path: '/runs/:runId',
							element: <RunPage />
						},
						{
							path: '/admin',
							element: <DevelopersLayout />,
							children: [
								{ path: 'import', element: <ImportPage /> },
								{ path: 'performance', element: <PerformancePage /> },
								{ path: 'flower', element: <FlowerFeature /> },
								{ path: 'users', element: <AdminUsersPage /> },
								{ path: 'config', element: <ConfigsPage /> },
								{ element: <NoMatchFeature /> }
							]
						},
						{
							path: '/help',
							children: [
								{ path: 'faq', element: <HelpPage /> },
								{ path: 'changelog', element: <ChangelogPage /> }
							]
						},
						{
							path: '/settings',
							element: (
								<PrivateRoute>
									<SettingsLayout />
								</PrivateRoute>
							),
							children: [
								{ path: 'profile', element: <SettingsProfilePage /> },
								{ path: 'appearance', element: <SettingsAppearancePage /> }
							]
						},
						{ path: '*', element: <NoMatchFeature /> }
					]
				}
			]
		}
	],
	{
		basename: config.baseUrl,
		future: { v7_normalizeFormMethod: true }
	}
);

export const Router = () => {
	return <RouterProvider router={router} />;
};
