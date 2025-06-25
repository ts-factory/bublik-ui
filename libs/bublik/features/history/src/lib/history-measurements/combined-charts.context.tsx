import React, {
	createContext,
	useContext,
	useState,
	useMemo,
	ReactNode
} from 'react';
import { useNavigate, useSearchParams, To } from 'react-router-dom';
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
	}) => void;
	handleRemoveClick: (plot: SingleMeasurementChart) => void;
	handleResetButtonClick: () => void;
	handleOpenButtonClick: () => void;
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
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const handleAddChartClick = (args: {
		plot: SingleMeasurementChart;
		color: string;
	}) => {
		const { plot, color } = args;
		const plotId = String(plot.id);
		if (!selectedCharts.find(({ plot: p }) => String(p.id) === plotId)) {
			setSelectedCharts([...selectedCharts, { plot, color }]);
		} else {
			setSelectedCharts(
				selectedCharts.filter(({ plot: p }) => String(p.id) !== plotId)
			);
		}
	};

	const handleRemoveClick = (plot: SingleMeasurementChart) => {
		const plotId = String(plot.id);
		setSelectedCharts(
			selectedCharts.filter(({ plot: p }) => String(p.id) !== plotId)
		);
	};

	const handleResetButtonClick = () => {
		setSelectedCharts([]);
	};

	const linkToCombined = useMemo<To>(() => {
		const params = new URLSearchParams(searchParams);
		params.set('mode', 'measurements-combined');
		params.set(
			'combinedPlots',
			selectedCharts.map((p) => String(p.plot.id)).join(';')
		);
		return { pathname: '/history', search: params.toString() };
	}, [selectedCharts, searchParams]);

	const handleOpenButtonClick = () => {
		navigate(linkToCombined);
	};

	const value = useMemo(
		() => ({
			selectedCharts,
			handleAddChartClick,
			handleRemoveClick,
			handleResetButtonClick,
			handleOpenButtonClick
		}),
		[
			selectedCharts,
			handleOpenButtonClick,
			handleAddChartClick,
			handleRemoveClick,
			handleResetButtonClick
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
