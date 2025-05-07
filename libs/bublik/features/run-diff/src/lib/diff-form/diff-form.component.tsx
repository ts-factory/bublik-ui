/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
	Input,
	Popover,
	PopoverContent,
	PopoverTrigger,
	cn,
	Icon,
	ButtonTw
} from '@/shared/tailwind-ui';

const DiffFormSchema = z.object({
	leftRunId: z.coerce
		.number({
			invalid_type_error: 'Must be number',
			required_error: 'Run ID must be specified'
		})
		.int({ message: 'Must not be a double number' })
		.positive('Run ID must be positive number'),
	rightRunId: z.coerce
		.number({
			invalid_type_error: 'Must be number',
			required_error: 'Run ID must be specified'
		})
		.int({ message: 'Must not be a double number' })
		.positive('Run ID must be positive number')
});

export type DiffFormValues = z.infer<typeof DiffFormSchema>;

export interface DiffFormProps {
	defaultValues?: Partial<DiffFormValues>;
	onSubmit: (form: DiffFormValues) => void;
	defaultOpen?: boolean;
}

export const DiffForm: FC<DiffFormProps> = ({
	defaultOpen,
	onSubmit,
	defaultValues
}) => {
	const { handleSubmit, register, formState, setFocus, getValues } =
		useForm<DiffFormValues>({
			defaultValues,
			resolver: zodResolver(DiffFormSchema)
		});
	const [isOpen, setIsOpen] = useState(false);

	const { leftRunId: leftRunError, rightRunId: rightRunError } =
		formState.errors;

	const handleOpenAutoFocus = (e: Event) => {
		e.preventDefault();

		const leftRunId = getValues('leftRunId');

		if (leftRunId) {
			setFocus('rightRunId');
		} else {
			setFocus('leftRunId');
		}
	};

	return (
		<Popover defaultOpen={defaultOpen} onOpenChange={setIsOpen} modal>
			<PopoverTrigger asChild>
				<ButtonTw variant="secondary" size="xss" state={isOpen && 'active'}>
					<Icon
						name="SwapArrows"
						size={16}
						className={cn(
							'rotate-90 text-primary transition-colors mr-1.5',
							isOpen && 'text-white'
						)}
					/>
					Compare
				</ButtonTw>
			</PopoverTrigger>
			<PopoverContent
				asChild
				sideOffset={8}
				onOpenAutoFocus={handleOpenAutoFocus}
			>
				<div className="relative p-4 bg-white rounded-md w-80 shadow-popover">
					<form
						className="flex flex-col gap-4"
						onSubmit={handleSubmit(onSubmit)}
					>
						<span className="text-[0.875rem] leading-[1.125rem] font-semibold">
							Compare runs
						</span>
						<Input
							label="Left run id"
							{...register('leftRunId')}
							error={leftRunError?.message}
							placeholder="12345678"
						/>
						<Input
							label="Right run id"
							{...register('rightRunId')}
							error={rightRunError?.message}
							placeholder="12345678"
						/>
						<ButtonTw
							variant="primary"
							size="md"
							rounded="lg"
							className="justify-center"
							type="submit"
						>
							Submit
						</ButtonTw>
					</form>
				</div>
			</PopoverContent>
		</Popover>
	);
};
