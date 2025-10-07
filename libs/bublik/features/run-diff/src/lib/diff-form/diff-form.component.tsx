/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useState } from 'react';
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
	ButtonTw,
	Tooltip
} from '@/shared/tailwind-ui';

const RunIdOrUrl = z
	.string()
	.trim()
	.refine((val) => val !== '', { message: 'Must be a valid URL or Run ID' })
	.superRefine((val, ctx) => {
		const num = Number(val);
		if (!isNaN(num) && val !== '') {
			if (!Number.isInteger(num)) {
				ctx.addIssue({ code: 'custom', message: 'Must not be a decimal' });
			} else if (num <= 0) {
				ctx.addIssue({ code: 'custom', message: 'Must be positive number' });
			}
		} else {
			try {
				new URL(val);
			} catch {
				ctx.addIssue({ code: 'custom', message: 'Must be a valid URL' });
			}
		}
	});

const DiffFormSchema = z.object({
	leftRunId: RunIdOrUrl,
	rightRunId: RunIdOrUrl
});

export type DiffFormValues = z.infer<typeof DiffFormSchema>;

export interface DiffFormProps {
	defaultValues?: Partial<DiffFormValues>;
	onSubmit: (form: DiffFormValues) => void;
	defaultOpen?: boolean;
}

const DiffForm = (props: DiffFormProps) => {
	const { defaultOpen, onSubmit, defaultValues } = props;
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
						<div className="flex items-center gap-2">
							<span className="text-[0.875rem] leading-[1.125rem] font-semibold">
								Compare Runs
							</span>
							<Tooltip content="You can provide run id as a number or provide URL to a run">
								<div className="mr-auto text-primary hover:bg-primary-wash rounded-sm p-0.5">
									<Icon
										name="InformationCircleQuestionMark"
										className="text-primary"
										size={18}
									/>
								</div>
							</Tooltip>
						</div>
						<Input
							label="Left Run"
							{...register('leftRunId')}
							error={leftRunError?.message}
							placeholder="Run ID or URL"
						/>
						<Input
							label="Right Run"
							{...register('rightRunId')}
							error={rightRunError?.message}
							placeholder="Run ID or URL"
						/>
						<ButtonTw
							variant="primary"
							size="md"
							rounded="lg"
							className="justify-center"
							type="submit"
						>
							Compare
						</ButtonTw>
					</form>
				</div>
			</PopoverContent>
		</Popover>
	);
};

export { DiffForm };
