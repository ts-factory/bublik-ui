import { useCallback, useMemo, useRef, useState } from 'react';
import {
	BrowserRouter,
	Route,
	Routes,
	useSearchParams
} from 'react-router-dom';
import { Provider } from 'react-redux';

import { CardHeader, TooltipProvider } from '@/shared/tailwind-ui';
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

import { jsonAPI, store } from './store';

function Router() {
	return (
		<Provider store={store}>
			<TooltipProvider>
				<BrowserRouter>
					<Routes>
						<Route path="/" Component={Root} />
					</Routes>
				</BrowserRouter>
			</TooltipProvider>
		</Provider>
	);
}

function Root() {
	return (
		<div className="flex h-full gap-1 p-2 overflow-y-hidden">
			<aside className="w-96 bg-white rounded-md shrink-0">
				<TreeContainer />
			</aside>
			<main className="bg-white rounded-md flex-1 flex flex-col overflow-hidden">
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
	const [searchParams, setSearchParams] = useSearchParams();
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

	const isShowingRunLog = !searchParams.get('focusId');

	const showRunLog = () => {
		const s = new URLSearchParams(searchParams);
		s.delete('focusId');

		setSearchParams(s);
	};

	const id = searchParams.get('focusId')
		? searchParams.get('focusId')
		: data?.main_package;

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
	const [searchParams] = useSearchParams();

	const id = searchParams.get('focusId')
		? searchParams.get('focusId')
		: undefined;

	const page = searchParams.get('page')
		? Number(searchParams.get('page'))
		: undefined;

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

function App() {
	return <Router />;
}

export { App };
