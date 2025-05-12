/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, forwardRef, useCallback, useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
	DefineCompromisedFormValues,
	RunDetailsAPIResponse
} from '@/shared/types';
import {
	BUBLIK_TAG,
	bublikAPI,
	useDeleteCompromisedStatusMutation,
	useGetCompromisedTagsQuery,
	useMarkAsCompromisedMutation
} from '@/services/bublik-api';
import {
	SelectValue,
	Popover,
	PopoverContent,
	PopoverTrigger,
	toast,
	Input,
	SelectInput,
	Icon,
	ButtonTw,
	cn,
	ButtonTwProps
} from '@/shared/tailwind-ui';
import { useDispatch } from 'react-redux';
import { formatTimeToAPI } from '@/shared/utils';

interface CompromisedButtonProps {
	isCompromised: boolean;
	isError: boolean;
	isActive: boolean;
	isLoading: boolean;
}

type DefineCompromisedProps = ButtonTwProps & CompromisedButtonProps;

export const CompromiseStatusButton = forwardRef<
	HTMLButtonElement,
	DefineCompromisedProps
>(({ isCompromised, isLoading, isError, isActive, ...props }, ref) => {
	const label = isCompromised ? 'Run is compromised' : 'Mark as compromised';

	return (
		<ButtonTw
			variant="secondary"
			size="xss"
			disabled={isError}
			className={cn(
				isCompromised && 'bg-bg-error text-white hover:shadow-none'
			)}
			state={
				isLoading
					? 'loading'
					: isError
					? 'disabled'
					: isActive
					? 'active'
					: 'default'
			}
			{...props}
			ref={ref}
		>
			{isLoading ? (
				<Icon
					name="ProgressIndicator"
					size={20}
					className="mr-1.5 animate-spin"
				/>
			) : (
				<Icon name="EyeHide" size={20} className="mr-2" />
			)}
			{label}
		</ButtonTw>
	);
});

CompromiseStatusButton.displayName = 'CompromiseStatusButton';

export interface DefineInfoProps {
	comment?: string;
	bugId?: string;
	bugUrl?: string;
	onDeleteClick: () => void;
}

export const CompromiseInfo = forwardRef<HTMLDivElement, DefineInfoProps>(
	({ comment = '', bugId = '', bugUrl = '', onDeleteClick }, ref) => {
		return (
			<div
				className="flex flex-col gap-4 p-3 w-[320px] bg-white rounded-md shadow-popover"
				ref={ref}
			>
				<div className="flex items-center justify-between">
					<span className="text-[0.875rem] font-semibold leading-[1.125rem]">
						Run is compromised
					</span>
					<button
						className="p-px transition-colors rounded-md text-primary hover:bg-primary-wash active:text-white active:bg-primary"
						onClick={onDeleteClick}
						aria-label="Remove compomised status"
					>
						<Icon name="Bin" size={22} />
					</button>
				</div>

				<p className="text-[0.875rem] text-text-menu leading-[0.875rem] break-all">
					{comment}
				</p>
				<a
					className="w-fit text-primary text-[0.875rem] leading-[1.125rem] bg-primary-wash px-2 py-1 rounded"
					href={bugUrl}
					target="_blank"
					rel="noreferrer"
				>
					Bug {bugId}
				</a>
			</div>
		);
	}
);

CompromiseInfo.displayName = 'CompromiseInfo';

const MarkAsCompromisedSchema = z.object({
	comment: z.coerce.string().min(1, { message: 'Comment is required' }),
	bugId: z.coerce
		.number({
			required_error: 'Bug ID is required',
			invalid_type_error: 'Bug ID must be a number'
		})
		.int({ message: 'Bug ID should be integer' })
		.positive({ message: 'Bug ID should be positive number' }),
	bugStorageKey: z.string().min(1, { message: 'Key is required' })
});

interface DefineCompromisedFormProps {
	onSubmit: (values: DefineCompromisedFormValues) => void;
	initialValues: DefineCompromisedFormValues;
	bugStorageKeys: SelectValue[];
}

export const CompromiseForm: FC<DefineCompromisedFormProps> = (props) => {
	const { onSubmit, initialValues, bugStorageKeys } = props;
	const {
		register,
		control,
		formState: { errors },
		handleSubmit
	} = useForm<DefineCompromisedFormValues>({
		defaultValues: initialValues,
		resolver: zodResolver(MarkAsCompromisedSchema)
	});

	return (
		<div className="min-w-[320px] p-4 bg-white rounded-md shadow-popover">
			<form onSubmit={handleSubmit(onSubmit)}>
				<fieldset>
					<div className="flex flex-col gap-5">
						<span className="text-[0.875rem] leading-[1.125rem] font-semibold">
							Mark as compromised
						</span>
						<Input
							label="Comment"
							{...register('comment')}
							error={errors?.comment?.message}
							placeholder="Comment"
							autoComplete="off"
						/>
						<Input
							label="Bug ID"
							{...register('bugId')}
							error={errors?.bugId?.message}
							placeholder="Bug ID"
							autoComplete="off"
						/>
						<Controller<DefineCompromisedFormValues>
							control={control}
							name="bugStorageKey"
							render={({ field }) => (
								<SelectInput
									label="Bugs storage"
									value={field.value}
									onValueChange={field.onChange}
									ref={field.ref}
									name={field.name}
									required
									options={bugStorageKeys}
								/>
							)}
						/>
						<div className="flex items-center gap-1">
							<ButtonTw
								size="md"
								rounded="lg"
								variant="primary"
								className="justify-center w-full"
								type="submit"
							>
								Submit
							</ButtonTw>
						</div>
					</div>
				</fieldset>
			</form>
		</div>
	);
};

CompromiseForm.displayName = 'CompromiseForm';

export interface DefineCompromisedFeatureProps {
	runId: string;
}

export const DefineCompromiseContainer = ({
	runId
}: DefineCompromisedFeatureProps) => {
	const {
		compromiseData,
		refData,
		isCompromised,
		isError,
		isLoading,
		handleAddCompromiseStatus,
		handleDeleteCompromiseStatus
	} = useRunCompromise({
		runId
	});

	const bugStorageKeys = useMemo<SelectValue[]>(() => {
		return Object.entries(refData?.issues || {}).map(([key, value]) => ({
			value: key,
			displayValue: value.name
		}));
	}, [refData?.issues]);

	const initialValues: DefineCompromisedFormValues = useMemo(() => {
		const bugStorageKey = bugStorageKeys?.[0]?.value ?? '';
		const bugId = compromiseData?.compromised.bug_id?.toString() ?? '';
		const comment = compromiseData?.compromised.comment ?? '';

		return {
			bugStorageKey,
			bugId,
			comment
		};
	}, [bugStorageKeys, compromiseData?.compromised]);

	return (
		<CompromiseStatus
			initialValues={initialValues}
			isCompromised={isCompromised}
			isLoading={isLoading}
			isError={isError}
			deleteCompromisedStatus={handleDeleteCompromiseStatus}
			addCompromiseStatus={handleAddCompromiseStatus}
			tags={bugStorageKeys}
			runDetails={compromiseData}
		/>
	);
};

DefineCompromiseContainer.displayName = 'DefineCompromiseContainer';

export interface CompromiseStatusProps {
	deleteCompromisedStatus: () => void;
	addCompromiseStatus: (values: DefineCompromisedFormValues) => void;
	initialValues: DefineCompromisedFormValues;
	tags?: SelectValue[];
	runDetails?: RunDetailsAPIResponse;
	isLoading: boolean;
	isError: boolean;
	isCompromised?: boolean;
}

export const CompromiseStatus = (props: CompromiseStatusProps) => {
	const {
		initialValues,
		isCompromised = false,
		isError,
		isLoading,
		runDetails,
		tags,
		addCompromiseStatus,
		deleteCompromisedStatus
	} = props;
	const [isOpen, setIsOpen] = useState(false);

	const handleAddCompromiseStatusSubmit = async (
		form: DefineCompromisedFormValues
	) => {
		addCompromiseStatus(form);
		setIsOpen(false);
	};

	const handleDeleteCompromiseStatusClick = async () => {
		deleteCompromisedStatus();
		setIsOpen(false);
	};

	const renderContent = () => {
		if (!runDetails || !tags?.length) return null;

		if (isCompromised) {
			return (
				<CompromiseInfo
					comment={runDetails.compromised.comment}
					bugId={runDetails.compromised.bug_id}
					bugUrl={runDetails.compromised.bug_url}
					onDeleteClick={handleDeleteCompromiseStatusClick}
				/>
			);
		}

		return (
			<CompromiseForm
				bugStorageKeys={tags}
				initialValues={initialValues}
				onSubmit={handleAddCompromiseStatusSubmit}
			/>
		);
	};

	return (
		<Popover onOpenChange={setIsOpen} open={isOpen} modal>
			<PopoverTrigger asChild aria-label="Compromised form">
				<CompromiseStatusButton
					isCompromised={isCompromised}
					isLoading={isLoading}
					isError={isError}
					isActive={isOpen}
				/>
			</PopoverTrigger>
			<PopoverContent sideOffset={8}>{renderContent()}</PopoverContent>
		</Popover>
	);
};

type UseCompromiseConfig = { runId: string };

export const useRunCompromise = ({ runId }: UseCompromiseConfig) => {
	const dispatch = useDispatch();
	const {
		data: refData,
		isFetching: isRefsLoading,
		isError: isRefError
		// TODO: Update with project id
	} = useGetCompromisedTagsQuery({ projects: [] });

	const {
		data: compromiseData,
		isFetching: isStatusLoading,
		isError: isCompromiseDataError
	} = bublikAPI.endpoints.getRunDetails.useQueryState(runId ?? skipToken);

	const [markAsCompromisedMutation] = useMarkAsCompromisedMutation();
	const [deleteCompromiseStatusMutation] = useDeleteCompromisedStatusMutation();

	const isLoading = isStatusLoading || isRefsLoading;
	const isError = isCompromiseDataError || isRefError;
	const isCompromised = compromiseData?.compromised?.status;

	const DASHBOARD_TO_INVALIDATE = useMemo(() => {
		if (!compromiseData) {
			return [{ type: BUBLIK_TAG.DashboardData }];
		}

		return [
			{
				type: BUBLIK_TAG.DashboardData,
				id: formatTimeToAPI(new Date(compromiseData.start))
			},
			{
				type: BUBLIK_TAG.DashboardData,
				id: formatTimeToAPI(new Date(compromiseData.finish))
			}
		];
	}, [compromiseData]);

	const handleAddCompromiseStatus = useCallback(
		async (form: DefineCompromisedFormValues) => {
			const { bugId, comment, bugStorageKey } = form;

			const markCompromisePromise = markAsCompromisedMutation({
				bugId: parseInt(bugId),
				comment,
				referenceKey: bugStorageKey,
				runId: parseInt(runId)
			}).unwrap();

			toast.promise(markCompromisePromise, {
				success: 'Added compromise status!',
				loading: 'Marking run as compromised!',
				error: 'Failed to add compromise status!',
				position: 'top-center'
			});
			dispatch(bublikAPI.util.invalidateTags(DASHBOARD_TO_INVALIDATE));
		},
		[markAsCompromisedMutation, runId, dispatch, DASHBOARD_TO_INVALIDATE]
	);

	const handleDeleteCompromiseStatus = useCallback(async () => {
		const deleteCompromisePromise =
			deleteCompromiseStatusMutation(runId).unwrap();

		toast.promise(deleteCompromisePromise, {
			success: 'Removed compromise status!',
			loading: 'Removing compromise status...',
			error: 'Failed to remove compromise status!',
			position: 'top-center'
		});
		dispatch(bublikAPI.util.invalidateTags(DASHBOARD_TO_INVALIDATE));
	}, [
		DASHBOARD_TO_INVALIDATE,
		deleteCompromiseStatusMutation,
		dispatch,
		runId
	]);

	return {
		isCompromised,
		isLoading,
		isError,
		compromiseData,
		refData,
		handleDeleteCompromiseStatus,
		handleAddCompromiseStatus
	} as const;
};
