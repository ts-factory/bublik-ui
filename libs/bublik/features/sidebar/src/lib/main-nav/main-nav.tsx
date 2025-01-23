/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useState } from 'react';

import { LogPageMode, MeasurementsMode } from '@/shared/types';
import {
	ButtonTw,
	DialogClose,
	DialogDescription,
	DialogTitle,
	Icon,
	Dialog,
	DialogPortal,
	ModalContent
} from '@/shared/tailwind-ui';

import { NavLink, SidebarItem } from '../nav-link';

import multipleRuns1 from './images/runs/multiple-1.png';
import multipleRuns2 from './images/runs/multiple-2.png';
import multipleRuns3 from './images/runs/multiple-3.png';

import compareRuns1 from './images/runs/compare.png';

import runLinkFromSessionList from './images/runs/run-link-session-list.png';
import runSidebar from './images/runs/go-to-run-details.png';
import runReport from './images/runs/report-link.png';

import logLinkFromRuns from './images/log/log-link.png';
import logLinkFromRunDetails from './images/log/log-from-run.png';
import logLinkFromHistory from './images/log/log-from-history.png';

import resultLinkFromLog from './images/result/result-from-log.png';
import resultLinkFromRunDetails from './images/result/result-from-run.png';
import resultLinkFromHistory from './images/result/result-from-history.png';

type Step = {
	title: string;
	description: string;
	image: string;
};

interface InstructionDialogProps {
	dialogTitle: string;
	dialogDescription: string;
	steps: Step[];
}

function InstructionDialog({
	dialogTitle,
	dialogDescription,
	steps
}: InstructionDialogProps) {
	const [currentStep, setCurrentStep] = useState(0);
	const [isImageZoomed, setIsImageZoomed] = useState(false);

	const handleNext = () => {
		if (currentStep < steps.length - 1) {
			setCurrentStep(currentStep + 1);
		}
	};

	const handlePrevious = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	return (
		<>
			<div className="bg-white p-6 rounded-lg sm:max-w-[600px]">
				<div className="">
					<div className="flex flex-col gap-2">
						<div className="flex justify-between items-center">
							<DialogTitle className="text-lg font-semibold leading-none tracking-tight">
								{dialogTitle}
							</DialogTitle>
							<DialogClose className="grid place-items-center text-text-menu hover:text-primary hover:bg-primary-wash p-1">
								<Icon name="Cross" size={14} className="" />
							</DialogClose>
						</div>
						<DialogDescription className="text-sm text-gray-500">
							{dialogDescription}
						</DialogDescription>
					</div>
				</div>

				<div className="mt-4">
					<div className="relative">
						<img
							src={steps[currentStep].image}
							alt={`Step ${currentStep + 1}`}
							width={500}
							height={300}
							className="rounded-lg cursor-zoom-in"
							onClick={() => setIsImageZoomed(true)}
						/>
					</div>
					<h3 className="text-lg font-semibold mt-4">
						Step {currentStep + 1}: {steps[currentStep].title}
					</h3>
					<p className="text-sm text-gray-500 mt-2">
						{steps[currentStep].description}
					</p>
				</div>
				<div className="flex justify-between mt-6">
					<ButtonTw
						onClick={handlePrevious}
						disabled={currentStep === 0}
						variant="outline"
					>
						<Icon name="ArrowShortTop" className="mr-2 h-4 w-4 -rotate-90" />
						Previous
					</ButtonTw>
					<ButtonTw
						onClick={handleNext}
						disabled={currentStep === steps.length - 1}
					>
						<span>Next</span>
						<Icon name="ArrowShortTop" className="ml-2 h-4 w-4 rotate-90" />
					</ButtonTw>
				</div>
			</div>

			<Dialog open={isImageZoomed} onOpenChange={setIsImageZoomed}>
				<DialogPortal>
					<ModalContent className="max-w-[95vw] max-h-[95vh] p-0 bg-transparent">
						<div className="relative">
							<img
								src={steps[currentStep].image}
								alt={`Step ${currentStep + 1}`}
								className="w-full h-full object-contain cursor-zoom-out scale-125"
								onClick={() => setIsImageZoomed(false)}
							/>
						</div>
					</ModalContent>
				</DialogPortal>
			</Dialog>
		</>
	);
}

function MultipleRunsDialog() {
	return (
		<InstructionDialog
			dialogTitle="Multiple Runs"
			dialogDescription="Follow these steps to combine multiple runs."
			steps={[
				{
					title: 'Go to the Runs page',
					description: 'Visit the Runs page to view your existing runs.',
					image: multipleRuns1
				},
				{
					title: 'Select the runs you want to combine',
					description:
						'Select the runs you want to combine by clicking on them.',
					image: multipleRuns2
				},
				{
					title: 'Click on the "Multiple" button',
					description:
						'Click on the "Multiple" button to combine the selected runs.',
					image: multipleRuns3
				}
			]}
		/>
	);
}

function CompareRunsDialog() {
	return (
		<InstructionDialog
			dialogTitle="Compare Runs"
			dialogDescription="Follow these steps to compare runs."
			steps={[
				{
					title: 'Go to the Compare page',
					description: 'Visit the Compare page to view your existing runs.',
					image: multipleRuns1
				},
				{
					title: 'Select the runs you want to compare',
					description:
						'Select the runs you want to compare by clicking on them.',
					image: multipleRuns2
				},
				{
					title: 'Click on the "Compare" button',
					description:
						'Click on the "Compare" button to compare the selected runs.',
					image: compareRuns1
				}
			]}
		/>
	);
}

function RunDetailsDialog() {
	return (
		<InstructionDialog
			dialogTitle="Run Details"
			dialogDescription="Follow these steps to view run details."
			steps={[
				{
					title: 'Go to the Runs page',
					description: 'Visit the Runs page to view your existing runs.',
					image: multipleRuns1
				},
				{
					title: 'Select the run you want to view',
					description: 'Select the run you want to view by clicking on it.',
					image: runLinkFromSessionList
				}
			]}
		/>
	);
}

function RunReportDialog() {
	return (
		<InstructionDialog
			dialogTitle="Report"
			dialogDescription="Follow these steps to view run report."
			steps={[
				{
					title: 'Go to the Run Details page',
					description: 'Visit the Run Details page to view the run details.',
					image: runSidebar
				},
				{
					title: 'Click on the "Report" button',
					description: 'Click on the "Report" button to view the run report.',
					image: runReport
				}
			]}
		/>
	);
}

function LogDialog() {
	return (
		<InstructionDialog
			dialogTitle="Log"
			dialogDescription="Follow these steps to view log."
			steps={[
				{
					title: 'You can visit log from the Runs Page',
					description: 'Visit the Runs page to view the runs.',
					image: logLinkFromRuns
				},
				{
					title: 'You can visit log from the Run Details Page',
					description: 'Visit the Run Details page to view the run details.',
					image: logLinkFromRunDetails
				},
				{
					title: 'You can visit log from the History Page',
					description: 'Visit the History page to view the history.',
					image: logLinkFromHistory
				}
			]}
		/>
	);
}

function ResultMeasurementsDialog() {
	return (
		<InstructionDialog
			dialogTitle="Result"
			dialogDescription="Follow these steps to view result measurements."
			steps={[
				{
					title: 'You can visit result from the Log Page',
					description: 'Visit the Log page to view the log.',
					image: resultLinkFromLog
				},
				{
					title: 'You can visit result from the Run Details Page',
					description: 'Visit the Run Details page to view the run details.',
					image: resultLinkFromRunDetails
				},
				{
					title: 'You can visit result from the History Page',
					description: 'Visit the History page to view the history.',
					image: resultLinkFromHistory
				}
			]}
		/>
	);
}

const mainMenu: SidebarItem[] = [
	{
		label: 'Dashboard',
		to: '/dashboard',
		icon: <Icon name="Category" />,
		pattern: { path: '/dashboard' }
	},
	{
		label: 'Runs',
		to: '/runs',
		icon: <Icon name="Play" />,
		pattern: [{ path: '/runs' }, { path: '/compare' }, { path: '/multiple' }],
		subitems: [
			{
				label: 'List',
				to: '/runs',
				icon: <Icon name="PaperListText" size={24} />,
				pattern: { path: '/runs', search: { mode: 'table' } }
			},
			{
				label: 'Charts',
				to: '/runs',
				icon: <Icon name="LineChartMultiple" />,
				pattern: { path: '/runs', search: { mode: 'charts' } }
			},
			{
				label: 'Multiple',
				icon: <Icon name="PaperStack" className="w-6 h-6" />,
				to: '/runs',
				whenMatched: true,
				pattern: { path: '/multiple' },
				dialogContent: <MultipleRunsDialog />
			},
			{
				label: 'Compare',
				to: '/compare',
				whenMatched: true,
				dialogContent: <CompareRunsDialog />,
				icon: <Icon name="SwapArrows" className="rotate-90" />,
				pattern: { path: '/compare' }
			}
		]
	},
	{
		label: 'Run',
		to: '/runs',
		icon: <Icon name="PieChart" />,
		pattern: [{ path: '/runs/:runId' }],
		whenMatched: true,
		dialogContent: <RunDetailsDialog />,
		subitems: [
			{
				label: 'Details',
				icon: <Icon name="Paper" className="w-6 h-6" />,
				to: '/runs',
				whenMatched: true,
				dialogContent: <RunDetailsDialog />,
				pattern: { path: '/runs/:runId' }
			},
			{
				label: 'Report',
				icon: <Icon name="LineChart" />,
				to: '/runs',
				whenMatched: true,
				pattern: { path: '/runs/:runId/report' },
				dialogContent: <RunReportDialog />
			}
		]
	},
	{
		label: 'Log',
		icon: <Icon name="Paper" size={28} />,
		to: '/log',
		pattern: { path: '/log/:runId' },
		whenMatched: true,
		dialogContent: <LogDialog />,
		subitems: [
			{
				label: 'Tree+info+log',
				icon: <Icon name="LayoutLogHeaderSidebar" />,
				to: '/log',
				whenMatched: true,
				dialogContent: <LogDialog />,
				pattern: {
					path: '/log/:runId',
					search: { mode: LogPageMode.TreeAndInfoAndLog }
				}
			},
			{
				label: 'Tree+log',
				icon: <Icon name="LayoutLogSidebar" />,
				to: '/log',
				whenMatched: true,
				dialogContent: <LogDialog />,
				pattern: {
					path: '/log/:runId',
					search: { mode: LogPageMode.TreeAndLog }
				}
			},
			{
				label: 'Info+log',
				icon: <Icon name="LayoutLogHeader" />,
				to: '/log',
				whenMatched: true,
				dialogContent: <LogDialog />,
				pattern: {
					path: '/log/:runId',
					search: { mode: LogPageMode.InfoAndLog }
				}
			},
			{
				label: 'Log',
				icon: <Icon name="LayoutLogSingle" />,
				to: '/log',
				whenMatched: true,
				dialogContent: <LogDialog />,
				pattern: { path: '/log/:runId', search: { mode: LogPageMode.Log } }
			}
		]
	},
	{
		label: 'History',
		to: '/history',
		icon: <Icon name="TimeCircle" />,
		pattern: { path: '/history' },
		subitems: [
			{
				label: 'List Of Results',
				to: '/history',
				icon: <Icon name="PaperListText" />,
				pattern: { path: '/history', search: { mode: 'linear', page: '1' } }
			},
			{
				label: 'Groups Of Results',
				to: '/history',
				icon: <Icon name="Aggregation" />,
				pattern: {
					path: '/history',
					search: { mode: 'aggregation', page: '1' }
				}
			},
			{
				label: 'Charts',
				to: '/history',
				icon: <Icon name="LineChartSingle" />,
				pattern: { path: '/history', search: { mode: 'measurements' } }
			},
			{
				label: 'Stacked Charts',
				to: '/history',
				icon: <Icon name="LineChartMultiple" />,
				pattern: { path: '/history', search: { mode: 'measurements-combined' } }
			}
		]
	},
	{
		label: 'Result',
		to: '/runs/:runId/results/:resultId/measurements',
		icon: <Icon name="LineGraph" />,
		whenMatched: true,
		dialogContent: <ResultMeasurementsDialog />,
		pattern: {
			path: '/runs/:runId/results/:resultId/measurements',
			search: { mode: MeasurementsMode.Default }
		},
		subitems: [
			{
				label: 'Charts + Tables',
				icon: <Icon name="LineChart" />,
				to: '/runs',
				whenMatched: true,
				dialogContent: <ResultMeasurementsDialog />,
				pattern: {
					path: '/runs/:runId/results/:resultId/measurements',
					search: { mode: MeasurementsMode.Default }
				}
			},
			{
				label: 'Charts || Tables',
				icon: <Icon name="LayoutSidebarHeader" />,
				to: '/runs',
				whenMatched: true,
				dialogContent: <ResultMeasurementsDialog />,
				pattern: {
					path: '/runs/:runId/results/:resultId/measurements',
					search: { mode: MeasurementsMode.Split }
				}
			},
			{
				label: 'Measurement Tables',
				icon: <Icon name="PaperListText" />,
				to: '/runs',
				whenMatched: true,
				dialogContent: <ResultMeasurementsDialog />,
				pattern: {
					path: '/runs/:runId/results/:resultId/measurements',
					search: { mode: MeasurementsMode.Tables }
				}
			},
			{
				label: 'Stacked Charts',
				icon: <Icon name="LineChartMultiple" />,
				to: '/runs',
				whenMatched: true,
				dialogContent: <ResultMeasurementsDialog />,
				pattern: {
					path: '/runs/:runId/results/:resultId/measurements',
					search: { mode: MeasurementsMode.Overlay }
				}
			}
		]
	}
];

export const MainNavigation = () => {
	return (
		<ul className="flex flex-col gap-3">
			{mainMenu.map((item) => (
				<NavLink key={item.label} {...item} />
			))}
		</ul>
	);
};
