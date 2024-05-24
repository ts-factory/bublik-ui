/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	Navigate,
	Outlet,
	createBrowserRouter,
	RouterProvider
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
	RunReportPage
} from '../pages';
import { Layout } from './layout';
import { RedirectToLogPage } from './redirects';
import { PerformancePage } from '../pages/performance-page';

const router = createBrowserRouter(
	[
		{
			element: (
				<QueryParamProvider
					adapter={ReactRouter6Adapter}
					options={{ updateType: 'replaceIn' }}
				>
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
