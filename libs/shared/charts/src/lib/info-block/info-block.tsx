/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, SVGProps } from 'react';
import { format, isValid, parseISO } from 'date-fns';

import { TIME_DOT_FORMAT_FULL } from '@/shared/utils';
import { Icon } from '@/shared/tailwind-ui';

import { InfoItem } from './info-item';

const ObtainedResultIcon: FC<SVGProps<SVGAElement>> = () => {
	return (
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M20.0682 11.6314C20.4321 11.6314 20.728 11.3356 20.728 10.9717V8.72962C20.728 5.36002 18.6247 3.27246 15.2761 3.27246H8.7306C5.361 3.27246 3.27344 5.36002 3.27344 8.73224V15.2777C3.27344 18.6394 5.361 20.727 8.7306 20.727H15.2787C18.6404 20.727 20.728 18.6394 20.7254 15.2751C20.7254 14.9068 20.4269 14.6074 20.0577 14.6074C19.6886 14.6074 19.3901 14.9068 19.3901 15.2751C19.3901 17.9229 17.9318 19.3891 15.2761 19.3891H8.7306C6.07489 19.3891 4.60871 17.9229 4.60871 15.2751V8.72962C4.60871 6.07392 6.07489 4.60773 8.73322 4.60773H15.2787C17.9353 4.60773 19.3927 6.06519 19.3927 8.72962V10.9481V10.9498C19.3936 11.3181 19.6921 11.6157 20.0603 11.6157V11.6314H20.0682Z"
				fill="currentColor"
			/>
			<path
				d="M9.74771 15.4965H15.1293C15.542 15.4965 15.877 15.1582 15.877 14.7414C15.877 14.3246 15.542 13.9863 15.1293 13.9863H9.74771C9.33498 13.9863 9 14.3246 9 14.7414C9 15.1582 9.33498 15.4965 9.74771 15.4965Z"
				fill="currentColor"
			/>
			<path
				d="M9.74771 10.5102H13.0935C13.5062 10.5102 13.8412 10.1719 13.8412 9.7551C13.8412 9.33828 13.5062 9 13.0935 9H9.74771C9.33498 9 9 9.33828 9 9.7551C9 10.1719 9.33498 10.5102 9.74771 10.5102Z"
				fill="currentColor"
			/>
		</svg>
	);
};

export interface InfoBlockProps {
	name: string;
	obtainedResult?: string;
	parameters: string[];
	isError?: boolean;
	separator?: string;
	start?: string;
}

export function InfoBlock(props: InfoBlockProps) {
	const {
		name,
		obtainedResult,
		isError,
		parameters,
		start,
		separator = '='
	} = props;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-4">
				<InfoItem
					label="Test name"
					value={name}
					icon={<Icon name="Paper" size={24} />}
				/>
				{typeof start !== 'undefined' && isValid(new Date(start)) ? (
					<InfoItem
						label="Start"
						value={format(parseISO(start), TIME_DOT_FORMAT_FULL)}
						icon={<Icon name="Clock" size={24} />}
					/>
				) : null}
				{typeof obtainedResult !== 'undefined' &&
				typeof isError !== 'undefined' ? (
					<InfoItem
						label="Obtained result"
						value={obtainedResult}
						icon={<ObtainedResultIcon />}
						isError={isError}
					/>
				) : null}
			</div>
			<div className="flex flex-wrap items-center gap-4">
				{parameters.map((param) => {
					const [label, value] = param.split(separator);

					return <InfoItem key={param} label={label} value={value} />;
				})}
			</div>
		</div>
	);
}
