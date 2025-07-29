import { DrawerRoot, DrawerContent } from '@/shared/tailwind-ui';

interface TraceFlowDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	streamedData: any[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	followResult: any;
}

function TraceFlowDialog(props: TraceFlowDialogProps) {
	const { open, onOpenChange, streamedData, followResult } = props;

	return (
		<DrawerRoot open={open} onOpenChange={onOpenChange}>
			<DrawerContent className="w-full max-w-4xl flex flex-col">
				<div className="border-b p-4 flex justify-between items-center">
					<h3 className="text-lg font-semibold">Trace Flow</h3>
					<button
						onClick={() => onOpenChange(false)}
						className="text-gray-500 hover:text-gray-700"
					>
						&times;
					</button>
				</div>
				<div className="p-4 flex-grow overflow-auto">
					{streamedData.length > 0 ? (
						<div className="space-y-3">
							{streamedData.map((data, index) => (
								<div
									key={index}
									className={`whitespace-pre-wrap p-2 rounded ${
										data.server
											? 'bg-red-50 text-red-700'
											: 'bg-blue-50 text-blue-700'
									}`}
								>
									<div>{data.data}</div>
								</div>
							))}
						</div>
					) : (
						<div className="space-y-2 text-sm">
							<div>
								Server: {followResult?.shost}:{followResult?.sport}
							</div>
							<div>
								Client: {followResult?.chost}:{followResult?.cport}
							</div>
							<div>Sent by Server: {followResult?.sbytes} bytes</div>
							<div>Sent by Client: {followResult?.cbytes} bytes</div>
						</div>
					)}
				</div>
			</DrawerContent>
		</DrawerRoot>
	);
}

export { TraceFlowDialog };
