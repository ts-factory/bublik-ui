import { ComponentProps, ForwardedRef, forwardRef, useState } from 'react';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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
	DialogPortal,
	Icon
} from '@/shared/tailwind-ui';
import { setErrorsOnForm } from '@/shared/utils';

interface CreateProjectModalProps {
	children: React.ReactNode;
}

export function CreateProjectModal({ children }: CreateProjectModalProps) {
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
					<CreateProjectForm
						onSuccess={() => setIsOpen(false)}
						onCancel={() => setIsOpen(false)}
					/>
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
}

interface CreateProjectFormProps {
	onSuccess?: () => void;
	onCancel?: () => void;
}

function CreateProjectForm({ onSuccess, onCancel }: CreateProjectFormProps) {
	const [create] = bublikAPI.useCreateProjectMutation();

	const form = useForm<CreateProject>({
		defaultValues: { name: '' },
		resolver: zodResolver(CreateProjectSchema)
	});

	const handleSubmit = async (data: CreateProject) => {
		const promise = create(data).unwrap();

		toast.promise(promise, {
			loading: 'Creating project...',
			success: 'Project created successfully',
			error: 'Failed to create project'
		});

		try {
			await promise;
			form.reset();
			onSuccess?.();
		} catch (e) {
			setErrorsOnForm(e, { handle: form });
		}
	};

	return (
		<form
			onSubmit={form.handleSubmit(handleSubmit)}
			className="flex flex-col gap-4"
		>
			<h2 className="text-xl font-semibold leading-tight text-text-primary">
				New Project
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
					Create
				</ButtonTw>
			</div>
		</form>
	);
}

type CreateProjectButtonProps = ComponentProps<typeof ButtonTw>;

function _CreateProjectButton(
	props: CreateProjectButtonProps,
	ref: ForwardedRef<HTMLButtonElement>
) {
	return (
		<CreateProjectModal>
			<ButtonTw {...props} ref={ref}>
				<Icon name="FilePlus" className="size-5 mr-1.5" />
				<span>New Project</span>
			</ButtonTw>
		</CreateProjectModal>
	);
}

const CreateProjectButton = forwardRef(_CreateProjectButton);

export { CreateProjectButton };
