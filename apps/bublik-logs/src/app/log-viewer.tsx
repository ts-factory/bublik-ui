/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useCallback, useMemo, useRef, useState } from 'react';
import { getRouteApi } from '@tanstack/react-router';

import { CardHeader } from '@/shared/tailwind-ui';
import {
	LogFrameEmpty,
	LogFrameError,
	TreeError,
	TreeHeader,
	TreeLoading,
	TreeView,
	getTreeOnlyWithErrors
} from '@/bublik/features/log';
import { SessionLoading, SessionRoot } from '@/bublik/features/session-log';

import { jsonAPI } from './store';

const routeApi = getRouteApi('/');

function LogViewer() {
	return (
		<div className="flex h-full gap-1 p-2 overflow-y-hidden">
			<aside className="w-96 bg-bg-primary rounded-md shrink-0">
				<TreeContainer />
			</aside>
			<main className="bg-bg-primary rounded-md flex-1 flex flex-col overflow-hidden">
				<CardHeader label="Log" />
				<div className="flex-1 overflow-auto">
					<LogContainer />
				</div>
			</main>
		</div>
	);
}

function TreeContainer() {
	const { data, isLoading, error } = jsonAPI.useGetJsonTreeQuery();
	const { focusId } = routeApi.useSearch();
	const navigate = routeApi.useNavigate();
	const [showOnlyErrors, setShowOnlyErrors] = useState(false);

	const treeWithOnlyErrors = useMemo(() => {
		if (!data) return null;

		const treeOnlyWithErrors = getTreeOnlyWithErrors(data);

		if (!treeOnlyWithErrors) return null;

		return { ...data, tree: treeOnlyWithErrors };
	}, [data]);

	const scrollToFocusRef = useRef<(() => void) | undefined>();

	const handleScrollToFocusClick = useCallback(() => {
		scrollToFocusRef.current?.();
	}, []);

	const handleNokClick = useCallback(() => {
		setShowOnlyErrors((prev) => !prev);
	}, []);

	const isShowingRunLog = !focusId;

	// A push that drops only `focusId`, as React Router's `setSearchParams` did.
	const showRunLog = () => {
		void navigate({
			search: (search) => ({ ...search, focusId: undefined }),
			resetScroll: false
		});
	};

	const id = focusId ? focusId : data?.main_package;

	if (isLoading) return <TreeLoading />;

	if (error) return <TreeError error={error} />;

	if (!data || !treeWithOnlyErrors) return;

	return (
		<div className="h-full flex flex-col">
			<TreeHeader
				hasErrors={treeWithOnlyErrors !== null}
				isNokMode={showOnlyErrors}
				isShowingRunLog={isShowingRunLog}
				onScrollToFocusClick={handleScrollToFocusClick}
				onRunButtonClick={showRunLog}
				onNokClick={handleNokClick}
			/>
			<div className="flex-1">
				<TreeView
					data={showOnlyErrors ? treeWithOnlyErrors : data}
					itemSize={28}
					focusId={id ?? null}
					ref={scrollToFocusRef}
				/>
			</div>
		</div>
	);
}

function LogContainer() {
	const search = routeApi.useSearch();

	const id = search.focusId ? search.focusId : undefined;
	const page = search.page ? Number(search.page) : undefined;

	const { data, isLoading, error } = jsonAPI.useGetJsonLogQuery({ id, page });

	if (isLoading) return <SessionLoading />;

	if (error) return <LogFrameError error={error} />;

	if (!data) return <LogFrameEmpty />;

	return (
		<div className="p-2">
			<SessionRoot key={id ?? 'root'} root={data} />
		</div>
	);
}

export { LogViewer };
