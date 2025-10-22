import { z } from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PopoverClose, PopoverPortal } from '@radix-ui/react-popover';

import { bublikAPI } from '@/services/bublik-api';
import {
	ButtonTw,
	cn,
	Icon,
	Popover,
	PopoverContent,
	PopoverTrigger,
	textAreaStyles,
	toast,
	Tooltip
} from '@/shared/tailwind-ui';
import { de } from 'date-fns/locale';

const RunCommentFormSchema = z.object({
	comment: z.string()
});

interface RunCommentFormContainerProps {
	runId: number;
	defaultValues: z.infer<typeof RunCommentFormSchema>;
}

function RunCommentFormContainer(props: RunCommentFormContainerProps) {
	const { runId, defaultValues } = props;
	const form = useForm({
		defaultValues: defaultValues,
		resolver: zodResolver(RunCommentFormSchema)
	});
	const [updateRunComment] = bublikAPI.useUpdateRunCommentMutation();
	const [createRunComment] = bublikAPI.useCreateRunCommentMutation();
	const [deleteRunComment] = bublikAPI.useDeleteRunCommentMutation();

	async function onSubmit(data: z.infer<typeof RunCommentFormSchema>) {
		let promise: Promise<unknown>;

		if (data.comment === '') {
			promise = deleteRunComment({ runId });

			toast.promise(promise, {
				loading: 'Deleting comment...',
				success: 'Comment deleted successfully',
				error: 'Failed to delete comment'
			});

			await promise;
			return;
		}

		if (defaultValues.comment === '') {
			promise = createRunComment({ runId, comment: data.comment });
		} else {
			promise = updateRunComment({ runId, comment: data.comment });
		}

		toast.promise(promise, {
			loading: 'Updating comment...',
			success: 'Comment updated successfully',
			error: 'Failed to update comment'
		});

		await promise;
	}

	return (
		<Popover>
			<div className="flex items-center gap-2">
				<span className="text-text-menu text-[0.6875rem] font-medium leading-[0.875rem] mr-20">
					Comment
				</span>
				<pre className="text-[0.6875rem] font-medium leading-[0.875rem]">
					{defaultValues.comment || '—'}
				</pre>
				<Tooltip content="Edit Run Comment">
					<PopoverTrigger asChild>
						<ButtonTw variant="secondary" size="xss" className="size-6">
							<Icon name="Edit" className="size-5 shrink-0" />
							<span className="sr-only">Edit</span>
						</ButtonTw>
					</PopoverTrigger>
				</Tooltip>
			</div>

			<PopoverPortal container={document.body}>
				<PopoverContent
					className={cn(
						'relative p-4 bg-white flex flex-col gap-4 rounded-md w-96 shadow-popover'
					)}
					align="start"
					sideOffset={8}
				>
					<div className="flex items-center justify-between">
						<h2 className="text-[0.875rem] leading-[1.125rem] font-semibold text-left">
							Edit Comment
						</h2>
						<PopoverClose>
							<Icon name="Cross" className="size-3 text-text-menu" />
						</PopoverClose>
					</div>

					<form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
						<Controller
							control={form.control}
							name="comment"
							render={(f) => {
								return (
									<div className="flex gap-4 items-center">
										<div className="flex flex-col gap-2 w-full">
											<textarea
												value={f.field.value}
												onChange={f.field.onChange}
												onBlur={f.field.onBlur}
												placeholder="Run comment..."
												className={cn(
													textAreaStyles({
														variant: f.fieldState.error ? 'error' : 'primary'
													}),
													'resize-y sm:text-[0.75rem] font-medium leading-[0.875rem]',
													'min-h-20 min-w-80'
												)}
											/>
											<span
												className={cn(
													'text-[0.75rem] font-normal text-bg-error'
												)}
											>
												{f.fieldState.error?.message}
											</span>

											<ButtonTw type="submit" size="xs">
												{form.watch('comment') === '' &&
												defaultValues.comment !== ''
													? 'Delete'
													: defaultValues.comment === ''
													? 'Create'
													: 'Update'}
											</ButtonTw>
										</div>
									</div>
								);
							}}
						/>
					</form>
				</PopoverContent>
			</PopoverPortal>
		</Popover>
	);
}

export { RunCommentFormContainer };
