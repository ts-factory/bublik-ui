import { useState } from 'react';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
	bublikAPI,
	CreateProject,
	CreateProjectSchema
} from '@/services/bublik-api';
import {
	ButtonTw,
	cn,
	Dialog,
	DialogContent,
	dialogContentStyles,
	DialogOverlay,
	dialogOverlayStyles,
	DialogTrigger,
	Input,
	FormAlertError,
	DialogPortal
} from '@/shared/tailwind-ui';
import { setErrorsOnForm } from '@/shared/utils';

interface UpdateProjectModalProps {
	children: React.ReactNode;
	projectId: number;
	projectName: string;
}

function UpdateProjectModal({
	children,
	projectId,
	projectName
}: UpdateProjectModalProps) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogPortal>
				<DialogOverlay className={dialogOverlayStyles()} />
				<DialogContent
					className={cn(
						dialogContentStyles(),
						'sm:max-w-md p-6 bg-white sm:rounded-lg md:shadow min-w-[420px] overflow-auto max-h-[85vh]'
					)}
				>
					<UpdateProjectForm
						projectId={projectId}
						initialProjectName={projectName}
						onSuccess={() => setIsOpen(false)}
						onCancel={() => setIsOpen(false)}
					/>
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
}

interface UpdateProjectFormProps {
	projectId: number;
	initialProjectName: string;
	onSuccess?: () => void;
	onCancel?: () => void;
}

function UpdateProjectForm({
	projectId,
	initialProjectName,
	onSuccess,
	onCancel
}: UpdateProjectFormProps) {
	const [updateProject] = bublikAPI.useUpdateProjectMutation();
	const form = useForm<CreateProject>({
		defaultValues: { name: initialProjectName },
		resolver: zodResolver(CreateProjectSchema)
	});

	async function handleSubmit(data: CreateProject) {
		const promise = updateProject({ id: projectId, name: data.name }).unwrap();

		try {
			toast.promise(promise, {
				loading: 'Updating project...',
				success: 'Project updated successfully',
				error: 'Failed to update project'
			});

			await promise;
			form.reset({ name: data.name });
			onSuccess?.();
		} catch (e) {
			setErrorsOnForm(e, { handle: form });
		}
	}

	return (
		<form
			onSubmit={form.handleSubmit(handleSubmit)}
			className="flex flex-col gap-4"
		>
			<h2 className="text-xl font-semibold leading-tight text-text-primary">
				Update Project
			</h2>
			{form.formState.errors.root ? (
				<div className="mb-6">
					<FormAlertError
						title={'Error'}
						description={form.formState.errors.root?.message}
					/>
				</div>
			) : null}
			<Controller
				name="name"
				control={form.control}
				render={({ field }) => (
					<Input
						{...field}
						placeholder="Project name"
						type="text"
						label="Name"
						error={form.formState.errors.name?.message}
					/>
				)}
			/>
			<div className="flex justify-end gap-2">
				<ButtonTw variant="secondary" type="button" onClick={onCancel}>
					Cancel
				</ButtonTw>
				<ButtonTw type="submit" variant="primary">
					Update
				</ButtonTw>
			</div>
		</form>
	);
}

export { UpdateProjectModal };
