import {
	createContext,
	useContext,
	useState,
	useMemo,
	ReactNode,
	useCallback
} from 'react';
import { useNavigate, useSearchParams, To } from 'react-router-dom';
import { useQueryParam } from 'use-query-params';

import { SingleMeasurementChart } from '@/services/bublik-api';

interface SelectedChart {
	plot: SingleMeasurementChart;
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
}

const CombinedChartsContext = createContext<
	CombinedChartsContextValue | undefined
>(undefined);

export const CombinedChartsProvider = ({
	children
}: {
	children: ReactNode;
}) => {
	const [selectedCharts, setSelectedCharts] = useState<SelectedChart[]>([]);
	const [selectedGroup, setSelectedGroup] = useQueryParam<
		null | 'trend' | 'measurement'
	>('chart-group');
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const handleAddChartClick = useCallback(
		(args: {
			plot: SingleMeasurementChart;
			color: string;
			group: 'trend' | 'measurement';
		}) => {
			const { plot, color, group } = args;
			const plotId = String(plot.id);
			if (!selectedCharts.find(({ plot: p }) => String(p.id) === plotId)) {
				setSelectedCharts([...selectedCharts, { plot, color }]);
				if (selectedCharts.length === 0) {
					setSelectedGroup(group);
				}
			} else {
				const newCharts = selectedCharts.filter(
					({ plot: p }) => String(p.id) !== plotId
				);
				setSelectedCharts(newCharts);
				if (newCharts.length === 0) {
					setSelectedGroup(null);
				}
			}
		},
		[selectedCharts, setSelectedGroup]
	);

	const handleRemoveClick = useCallback(
		(plot: SingleMeasurementChart) => {
			const plotId = String(plot.id);
			const newCharts = selectedCharts.filter(
				({ plot: p }) => String(p.id) !== plotId
			);
			setSelectedCharts(newCharts);
			if (newCharts.length === 0) {
				setSelectedGroup(null);
			}
		},
		[selectedCharts, setSelectedGroup]
	);

	const handleResetButtonClick = useCallback(() => {
		setSelectedCharts([]);
		setSelectedGroup(null);
	}, [setSelectedGroup]);

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
			selectedGroup: selectedGroup ?? null
		}),
		[
			selectedCharts,
			handleOpenButtonClick,
			handleAddChartClick,
			handleRemoveClick,
			handleResetButtonClick,
			selectedGroup
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
