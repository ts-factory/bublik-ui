import {
	createContext,
	useContext,
	useState,
	useMemo,
	ReactNode,
	useCallback,
	useEffect
} from 'react';
import { useNavigate, useSearchParams, To } from 'react-router-dom';
import { useQueryParam } from 'use-query-params';

import { SingleMeasurementChart } from '@/services/bublik-api';
import { getColorByIdx } from '@/shared/charts';
import { resetSelectionPopoverOpenState } from '@/shared/tailwind-ui';

const HISTORY_TREND_SELECTED_CHARTS_POPOVER_STORAGE_KEY =
	'history-trend-selected-charts-popover-open';
const HISTORY_SERIES_SELECTED_CHARTS_POPOVER_STORAGE_KEY =
	'history-series-selected-charts-popover-open';

const selectedChartsPopoverStorageKeys = {
	trend: HISTORY_TREND_SELECTED_CHARTS_POPOVER_STORAGE_KEY,
	measurement: HISTORY_SERIES_SELECTED_CHARTS_POPOVER_STORAGE_KEY
} as const;

export interface SelectedChart {
	plot: SingleMeasurementChart;
	parameters?: string[];
	color: string;
}

interface CombinedChartsContextValue {
	selectedCharts: SelectedChart[];
	handleAddChartClick: (args: {
		plot: SingleMeasurementChart;
		color: string;
		group: 'trend' | 'measurement';
	}) => void;
	handleRemoveClick: (plot: SingleMeasurementChart) => void;
	handleResetButtonClick: () => void;
	handleOpenButtonClick: () => void;
	selectedGroup: 'trend' | 'measurement' | null;
	syncChartsFromData: (charts: SingleMeasurementChart[]) => void;
}

const CombinedChartsContext = createContext<
	CombinedChartsContextValue | undefined
>(undefined);

interface CombinedChartsProviderProps {
	children: ReactNode;
}

export const CombinedChartsProvider = (props: CombinedChartsProviderProps) => {
	const { children } = props;
	const [selectedCharts, setSelectedCharts] = useState<SelectedChart[]>([]);
	const [selectedGroup, setSelectedGroup] = useQueryParam<
		null | 'trend' | 'measurement'
	>('chart-group');
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const syncChartsFromData = useCallback(
		(charts: SingleMeasurementChart[]) => {
			const plotIdsStr = searchParams.get('combinedPlots');
			if (!plotIdsStr) return;

			const plotIds = plotIdsStr.split(';').map(String);

			if (plotIds.length > 0 && selectedCharts.length === 0) {
				const restoredCharts: SelectedChart[] = [];

				plotIds.forEach((id) => {
					// Color by the chart's position in the full list, matching how
					// getColorByIdx(idx) assigns colors at add time. Indexing by the
					// URL position instead would shift colors whenever a listed id is
					// missing from the loaded charts.
					const chartIdx = charts.findIndex((c) => String(c.id) === id);
					if (chartIdx !== -1) {
						restoredCharts.push({
							plot: charts[chartIdx],
							color: getColorByIdx(chartIdx)
						});
					}
				});

				if (restoredCharts.length > 0) setSelectedCharts(restoredCharts);
			}
		},
		[searchParams, selectedCharts.length]
	);

	useEffect(() => {
		const mode = searchParams.get('mode');
		const plotIdsStr = searchParams.get('combinedPlots');

		if (mode !== 'measurements-combined' && !plotIdsStr && selectedGroup) {
			setSelectedGroup(null);
		}
	}, [searchParams, selectedGroup, setSelectedGroup]);

	const updateUrlWithCharts = useCallback(
		(charts: SelectedChart[]) => {
			const params = new URLSearchParams(searchParams);

			if (charts.length > 0) {
				params.set(
					'combinedPlots',
					charts.map((c) => String(c.plot.id)).join(';')
				);
			} else {
				params.delete('combinedPlots');
			}

			navigate({ search: params.toString() }, { replace: true });
		},
		[searchParams, navigate]
	);

	const handleAddChartClick = useCallback(
		(args: {
			plot: SingleMeasurementChart;
			color: string;
			group: 'trend' | 'measurement';
			parameters?: string[];
		}) => {
			const { plot, color, group, parameters } = args;
			const plotId = String(plot.id);
			if (!selectedCharts.find(({ plot: p }) => String(p.id) === plotId)) {
				const newCharts = [...selectedCharts, { plot, color, parameters }];

				setSelectedCharts(newCharts);
				updateUrlWithCharts(newCharts);

				if (selectedCharts.length === 0) setSelectedGroup(group);
			} else {
				const newCharts = selectedCharts.filter(
					({ plot: p }) => String(p.id) !== plotId
				);
				setSelectedCharts(newCharts);
				updateUrlWithCharts(newCharts);
				if (newCharts.length === 0) {
					resetSelectionPopoverOpenState(
						selectedChartsPopoverStorageKeys[group]
					);
					setSelectedGroup(null);
				}
			}
		},
		[selectedCharts, setSelectedGroup, updateUrlWithCharts]
	);

	const handleRemoveClick = useCallback(
		(plot: SingleMeasurementChart) => {
			const plotId = String(plot.id);

			const newCharts = selectedCharts.filter(
				({ plot: p }) => String(p.id) !== plotId
			);

			setSelectedCharts(newCharts);
			updateUrlWithCharts(newCharts);

			if (newCharts.length === 0) {
				if (selectedGroup) {
					resetSelectionPopoverOpenState(
						selectedChartsPopoverStorageKeys[selectedGroup]
					);
				}
				setSelectedGroup(null);
			}
		},
		[selectedCharts, selectedGroup, setSelectedGroup, updateUrlWithCharts]
	);

	const handleResetButtonClick = useCallback(() => {
		resetSelectionPopoverOpenState(
			HISTORY_TREND_SELECTED_CHARTS_POPOVER_STORAGE_KEY
		);
		resetSelectionPopoverOpenState(
			HISTORY_SERIES_SELECTED_CHARTS_POPOVER_STORAGE_KEY
		);
		setSelectedCharts([]);
		setSelectedGroup(null);
		const params = new URLSearchParams(searchParams);
		params.delete('combinedPlots');
		navigate({ search: params.toString() }, { replace: true });
	}, [setSelectedGroup, searchParams, navigate]);

	const linkToCombined = useMemo<To>(() => {
		const params = new URLSearchParams(searchParams);
		params.set('mode', 'measurements-combined');
		params.set(
			'combinedPlots',
			selectedCharts.map((p) => String(p.plot.id)).join(';')
		);
		return { pathname: '/history', search: params.toString() };
	}, [selectedCharts, searchParams]);

	const handleOpenButtonClick = useCallback(() => {
		navigate(linkToCombined);
	}, [linkToCombined, navigate]);

	const value = useMemo(
		() => ({
			selectedCharts,
			handleAddChartClick,
			handleRemoveClick,
			handleResetButtonClick,
			handleOpenButtonClick,
			selectedGroup: selectedGroup ?? null,
			syncChartsFromData
		}),
		[
			selectedCharts,
			handleOpenButtonClick,
			handleAddChartClick,
			handleRemoveClick,
			handleResetButtonClick,
			selectedGroup,
			syncChartsFromData
		]
	);

	return (
		<CombinedChartsContext.Provider value={value}>
			{children}
		</CombinedChartsContext.Provider>
	);
};

export const useCombinedCharts = () => {
	const ctx = useContext(CombinedChartsContext);
	if (!ctx)
		throw new Error(
			'useCombinedCharts must be used within a CombinedChartsProvider'
		);
	return ctx;
};

export {
	HISTORY_SERIES_SELECTED_CHARTS_POPOVER_STORAGE_KEY,
	HISTORY_TREND_SELECTED_CHARTS_POPOVER_STORAGE_KEY
};
