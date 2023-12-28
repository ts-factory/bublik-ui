/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ReactNode } from 'react';

import { useCopyToClipboard } from '@/shared/hooks';
import { Icon, toast } from '@/shared/tailwind-ui';
import { checkSchema, upperCaseFirstLetter } from '@/shared/utils';

import {
	LogHeaderArtifactSchema,
	LogHeaderAuthorsSchema,
	LogHeaderBlock,
	LogHeaderVerdictSchema
} from '@/shared/types';
import { ParametersTable } from './parameters-table';
import { textStyle, urlStyles } from './styles';
import { EntityDisplay } from './entity';

export type KeyValueProps = {
	label: string;
	value: string | number;
	url?: string;
};

const KeyValue = (props: KeyValueProps) => {
	const [, copy] = useCopyToClipboard({
		onSuccess: () => toast.success(`Copied ${props.label.toLowerCase()}`),
		onError: () => toast.error(`Failed to copy ${props.label.toLowerCase()}`)
	});

	const handleCopyClick = () => {
		copy(props.url ? props.url : props.value.toString());
	};

	if (props.url) {
		return (
			<div className="flex items-center">
				<span className={textStyle({ bold: true })}>
					{upperCaseFirstLetter(props.label)}:
				</span>
				&nbsp;
				<a
					href={props.url}
					target="_blank"
					rel="noreferrer"
					className={urlStyles()}
				>
					{props.value}
				</a>
				<button
					className="ml-2 p-0.5 transition-all rounded hover:bg-primary-wash hover:text-primary opacity-0 group-hover:opacity-100 self-start"
					onClick={handleCopyClick}
				>
					<Icon name="Paper" size={18} />
				</button>
			</div>
		);
	}

	return (
		<div className="flex items-center group">
			<span className={textStyle({ bold: true })}>
				{upperCaseFirstLetter(props.label)}:
			</span>
			&nbsp;
			<span className={textStyle()}>{props.value}</span>
			<button
				className="ml-2 p-0.5 transition-all rounded hover:bg-primary-wash hover:text-primary opacity-0 group-hover:opacity-100 self-start"
				onClick={handleCopyClick}
			>
				<Icon name="Paper" size={18} />
			</button>
		</div>
	);
};

export interface KeyListProps {
	label: string;
	items:
		| LogHeaderBlock['meta']['artifacts']
		| LogHeaderBlock['meta']['authors']
		| LogHeaderBlock['meta']['verdicts'];
}

export const KeyList = (props: KeyListProps) => {
	const { label, items } = props;

	return (
		<div>
			<span className={textStyle({ bold: true })}>{label}:</span>
			<ul className="flex flex-col gap-1">
				{items?.map((item, idx) => {
					let content: ReactNode;

					if (checkSchema(LogHeaderAuthorsSchema, item)) {
						content = (
							<a href={`mailto:${item.email}`} className={urlStyles()}>
								{item.email}
							</a>
						);
					}

					if (checkSchema(LogHeaderVerdictSchema, item)) {
						content = <span className={textStyle()}>{item.verdict}</span>;
					}

					if (checkSchema(LogHeaderArtifactSchema, item)) {
						content = <span className={textStyle()}>{item.artifact}</span>;
					}

					return (
						<li key={idx} className="pl-4">
							{content}
						</li>
					);
				})}
			</ul>
		</div>
	);
};

export interface KeyValueList {
	model: LogHeaderBlock['entity_model'];
	meta: LogHeaderBlock['meta'];
}

const KeyValuesList = (props: KeyValueList) => {
	const {
		meta: {
			duration,
			end,
			start,
			artifacts,
			authors,
			description,
			objective,
			verdicts
		},
		model: { entity, extended_properties, id, name, result, error }
	} = props;

	const maybeTin = Object.entries(extended_properties).find(
		([key]) => key === 'tin'
	)?.[1];

	return (
		<div className="flex flex-col">
			<EntityDisplay
				entity={entity}
				id={maybeTin?.toString() ?? id}
				name={name}
				result={result}
				error={error}
			/>
			{Object.entries(extended_properties)
				.filter(([key]) => key !== 'tin')
				.map(([label, value]) => (
					<KeyValue key={label} label={label} value={value} />
				))}
			<KeyValue label="Start" value={start} />
			<KeyValue label="End" value={end} />
			<KeyValue label="Duration" value={duration} />
			{objective && <KeyValue label="Objective" value={objective} />}
			{description && (
				<KeyValue
					label="Description"
					value={description.text}
					url={description.url}
				/>
			)}
			{authors && <KeyList label="Authors" items={authors} />}
			{verdicts && <KeyList label="Verdicts" items={verdicts} />}
			{artifacts && <KeyList label="Artifacts" items={artifacts} />}
		</div>
	);
};

export const BlockLogMeta = (props: LogHeaderBlock) => {
	const { parameters } = props.meta;

	return (
		<div data-block-type={props.type} className="flex gap-4">
			<div className="p-2 border-r border-border-primary">
				<KeyValuesList meta={props.meta} model={props.entity_model} />
			</div>
			{parameters && (
				<div className="p-2">
					<ParametersTable parameters={parameters} />
				</div>
			)}
		</div>
	);
};
