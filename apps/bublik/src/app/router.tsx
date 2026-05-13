/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { lazy, useEffect, useState, Suspense } from 'react';
import {
	Outlet,
	createBrowserRouter,
	RouterProvider,
	useLocation
} from 'react-router-dom';
import { QueryParamProvider } from 'use-query-params';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';

import { config } from '@/bublik/config';
import {
	setAnalyticsEnabled,
	trackPageView
} from '@/bublik/features/analytics';
import { ErrorBoundary } from '@/shared/tailwind-ui';
import { bublikAPI } from '@/services/bublik-api';

import { AuthLayout } from '../pages/auth/auth.layout';
import { Layout } from './layout';
import { RedirectToDashboard, RedirectToLogPage } from './redirects';

import { AdminAnalyticsPage } from '../pages/admin-analytics';
import { AdminUsersPage } from '../pages/admin-users/admin-users.page';
import { ConfigsPage } from '../pages/configs/configs.page';
import { DashboardPageV2 } from '../pages/dashboard-page/dashboard-page-v2';
import {
	DevelopersLayout,
	FlowerFeature
} from '../pages/developers-page/developers-page';
import { EmailActivationPage } from '../pages/auth/email-activation.page';
import { ForgotPage } from '../pages/auth/forgot.page';
import { HelpPage } from '../pages/help-page/help-page';
import { LoginPage } from '../pages/auth/login.page';
import { LogPage } from '../pages/log-page/log-page';
import { NoMatchFeature } from '../pages/not-found-page/not-found-page';
import { ResetPasswordPage } from '../pages/auth/reset-password.page';
import { RunDiffPage } from '../pages/run-diff-page/run-diff-page';
import { RunMultiplePage } from '../pages/run-multiple';
import { RunPage } from '../pages/run-page/run-page';
import { HistoryPageV2 } from '../pages/history-page/history-page';

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
	Icon,
	Spinner
} from '@/shared/tailwind-ui';
import { useNavigateWithProject } from '@/bublik/features/projects';
import { RunsPage } from '../pages/runs-page';

const ImportPage = lazy(() =>
	import('../pages/import-page/import-page').then((module) => ({
		default: module.ImportPage
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

const RunReportPage = lazy(() =>
	import('../pages/run-report/run-report.page').then((module) => ({
		default: module.RunReportPage
	}))
);

function BublikCommand() {
	const [open, setOpen] = useState(false);
	const navigate = useNavigateWithProject();
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

function LazyRoute({ children }: { children: React.ReactNode }) {
	return (
		<Suspense fallback={<Spinner className="h-48" />}>{children}</Suspense>
	);
}

function AnalyticsRouteTracker() {
	const location = useLocation();
	const { data: features } = bublikAPI.useGetServerFeaturesQuery();
	const isAnalyticsEnabled = Boolean(features?.analytics_enabled);

	useEffect(() => {
		setAnalyticsEnabled(isAnalyticsEnabled);
	}, [isAnalyticsEnabled]);

	useEffect(() => {
		if (!isAnalyticsEnabled) return;

		trackPageView({ path: location.pathname });
	}, [isAnalyticsEnabled, location.pathname]);

	return null;
}

/**
 * When Bublik runs inside a cross-origin iframe (e.g. embedded in other webapp),
 * the parent frame cannot read URL due to Same-Origin Policy.
 * This component fires a `postMessage` to the parent on every route change
 * so the parent can track the currently focused test without any DOM hacks.
 *
 * Message format:
 * { "type": "bublik:navigation", "path": "/log/1", "search": "?focusId=336&mode=...", "focusId": 336 }
 * `focusId` is `null` when the run-level log (no specific test) is shown.
 */
function IframeNavigationReporter() {
	const location = useLocation();

	useEffect(() => {
		// Skip when not embedded — avoids unnecessary postMessage noise.
		if (window.parent === window) return;

		const params = new URLSearchParams(location.search);
		const raw = params.get('focusId');
		const parsed = raw !== null ? parseInt(raw, 10) : null;
		const focusId = parsed !== null && !Number.isNaN(parsed) ? parsed : null;

		window.parent.postMessage(
			{
				type: 'bublik:navigation',
				path: location.pathname,
				search: location.search,
				focusId
			},
			'*'
		);
	}, [location.pathname, location.search]);

	return null;
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
					<AnalyticsRouteTracker />
					<IframeNavigationReporter />
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
						{ path: '/', element: <RedirectToDashboard /> },
						{ path: '/dashboard', element: <DashboardPageV2 /> },
						{
							path: '/tools/packet-viewer',
							element: (
								<LazyRoute>
									<NetPacketAnalyzerPage />
								</LazyRoute>
							)
						},
						{
							path: '/history',
							element: <HistoryPageV2 />
						},
						{
							path: '/history/v2',
							element: <HistoryPageV2 />
						},
						{ path: '/log/:runId/:old', element: <RedirectToLogPage /> },
						{ path: '/log/:runId', element: <LogPage /> },
						{
							path: '/runs/:runId/report',
							element: (
								<LazyRoute>
									<RunReportPage />
								</LazyRoute>
							)
						},
						{
							path: '/runs/:runId/results/:resultId/measurements',
							element: (
								<LazyRoute>
									<MeasurementsPage />
								</LazyRoute>
							)
						},
						{
							path: '/runs',
							element: <RunsPage />
						},
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
								{
									path: 'import',
									element: (
										<LazyRoute>
											<ImportPage />
										</LazyRoute>
									)
								},
								{ path: 'flower', element: <FlowerFeature /> },
								{
									path: 'users',
									element: (
										<LazyRoute>
											<AdminUsersPage />
										</LazyRoute>
									)
								},
								{
									path: 'analytics',
									element: <AdminAnalyticsPage />
								},
								{
									path: 'config',
									element: (
										<LazyRoute>
											<ConfigsPage />
										</LazyRoute>
									)
								},
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
