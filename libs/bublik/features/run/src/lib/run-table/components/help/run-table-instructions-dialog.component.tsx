import {
	Icon,
	DialogTrigger,
	InstructionDialog,
	DialogPortal,
	ModalContent,
	Dialog
} from '@/shared/tailwind-ui';

import one from './img/run-use-1.webp';
import two from './img/run-use-2.webp';
import three from './img/run-use-3.webp';

function RunTableInstructionDialog() {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<button className="mr-auto text-primary hover:bg-primary-wash rounded-sm p-0.5">
					<Icon name="InformationCircleQuestionMark" size={16} />
				</button>
			</DialogTrigger>
			<DialogPortal>
				<ModalContent>
					<InstructionDialog
						dialogTitle="Run Table"
						dialogDescription="Run Table is a table that displays the results of the tests. It is used to filter and sort the tests by obtained results."
						steps={[
							{
								title: 'Filter Packages',
								description: 'You can filter packages by clicking on the badge',
								image: one
							},
							{
								title: 'Filter MultiplePackages',
								description:
									'You can filter multiple packages by clicking on the badge',
								image: two
							},
							{
								title: 'Filter And Open Subtree',
								description:
									'You can filter packages by status and open subtree by clicking on the badge',
								image: three
							}
						]}
					/>
				</ModalContent>
			</DialogPortal>
		</Dialog>
	);
}

export { RunTableInstructionDialog };
