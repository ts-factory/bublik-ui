import { useState } from 'react';
import { ButtonTw } from '../button';
import {
	Dialog,
	DialogClose,
	DialogDescription,
	DialogPortal,
	DialogTitle,
	ModalContent
} from '../dialog';
import { Icon } from '../icon';

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
			<div className="bg-white p-6 rounded-lg max-w-[1366px] xl:max-w-[1536px] 2xl:max-w-[1920px]">
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
							className="w-full h-auto max-h-[60vh] object-contain rounded-lg cursor-zoom-in"
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

export { InstructionDialog, type InstructionDialogProps, type Step };
