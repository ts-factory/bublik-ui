/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	Navigate,
	Outlet,
	createBrowserRouter,
	RouterProvider,
	useNavigate,
	useLocation
} from 'react-router-dom';
import { QueryParamProvider } from 'use-query-params';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';

import { config } from '@/bublik/config';
import { ErrorBoundary } from '@/shared/tailwind-ui';

import { AuthLayout } from '../pages/auth/auth.layout';
import { Layout } from './layout';
import { RedirectToLogPage } from './redirects';

import { lazy, useEffect, useState } from 'react';
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

const AdminUsersPage = lazy(() =>
	import('../pages/admin-users/admin-users.page').then((module) => ({
		default: module.AdminUsersPage
	}))
);

const ConfigsPage = lazy(() =>
	import('../pages/configs/configs.page').then((module) => ({
		default: module.ConfigsPage
	}))
);

const DashboardPageV2 = lazy(() =>
	import('../pages/dashboard-page/dashboard-page-v2').then((module) => ({
		default: module.DashboardPageV2
	}))
);

const DevelopersLayout = lazy(() =>
	import('../pages/developers-page/developers-page').then((module) => ({
		default: module.DevelopersLayout
	}))
);

const EmailActivationPage = lazy(() =>
	import('../pages/auth/email-activation.page').then((module) => ({
		default: module.EmailActivationPage
	}))
);

const FlowerFeature = lazy(() =>
	import('../pages/developers-page/developers-page').then((module) => ({
		default: module.FlowerFeature
	}))
);

const ForgotPage = lazy(() =>
	import('../pages/auth/forgot.page').then((module) => ({
		default: module.ForgotPage
	}))
);

const HelpPage = lazy(() =>
	import('../pages/help-page/help-page').then((module) => ({
		default: module.HelpPage
	}))
);

const HistoryPageV2 = lazy(() =>
	import('../pages/history-page/history-page').then((module) => ({
		default: module.HistoryPageV2
	}))
);

const ImportPage = lazy(() =>
	import('../pages/import-page/import-page').then((module) => ({
		default: module.ImportPage
	}))
);

const LoginPage = lazy(() =>
	import('../pages/auth/login.page').then((module) => ({
		default: module.LoginPage
	}))
);

const LogPage = lazy(() =>
	import('../pages/log-page/log-page').then((module) => ({
		default: module.LogPage
	}))
);

const MeasurementsPage = lazy(() =>
	import('../pages/measurements-page/measurements-page').then((module) => ({
		default: module.MeasurementsPage
	}))
);

const NetPacketAnalyzerPage = lazy(() =>
	import('../pages/net-packet-analyzer/net-packet-analyzer.page').then(
		(module) => ({
			default: module.NetPacketAnalyzerPage
		})
	)
);

const NoMatchFeature = lazy(() =>
	import('../pages/not-found-page/not-found-page').then((module) => ({
		default: module.NoMatchFeature
	}))
);

const ResetPasswordPage = lazy(() =>
	import('../pages/auth/reset-password.page').then((module) => ({
		default: module.ResetPasswordPage
	}))
);

const RunDiffPage = lazy(() =>
	import('../pages/run-diff-page/run-diff-page').then((module) => ({
		default: module.RunDiffPage
	}))
);

const RunMultiplePage = lazy(() =>
	import('../pages/run-multiple').then((module) => ({
		default: module.RunMultiplePage
	}))
);

const RunPage = lazy(() =>
	import('../pages/run-page/run-page').then((module) => ({
		default: module.RunPage
	}))
);

const RunReportPage = lazy(() =>
	import('../pages/run-report/run-report.page').then((module) => ({
		default: module.RunReportPage
	}))
);

const RunsPage = lazy(() =>
	import('../pages/runs-page/runs-page').then((module) => ({
		default: module.RunsPage
	}))
);

function BublikCommand() {
	const [open, setOpen] = useState(false);
	const navigate = useNavigate();
	const location = useLocation();

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
							onSelect={handleSelect(() =>
								navigate(
									`${location.pathname}?settings-open=1&settings-tab=account`
								)
							)}
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
						{
							path: '/tools/packet-viewer',
							element: <NetPacketAnalyzerPage />
						},
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
						{ path: '/multiple', element: <RunMultiplePage /> },
						{
							path: '/runs/:runId',
							element: <RunPage />
						},
						{
							path: '/admin',
							element: <DevelopersLayout />,
							children: [
								{ path: 'import', element: <ImportPage /> },
								{ path: 'flower', element: <FlowerFeature /> },
								{ path: 'users', element: <AdminUsersPage /> },
								{ path: 'config', element: <ConfigsPage /> },
								{ element: <NoMatchFeature /> }
							]
						},
						{
							path: '/help',
							children: [{ path: 'faq', element: <HelpPage /> }]
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
