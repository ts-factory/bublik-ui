/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import ReactJson, { ReactJsonViewProps } from 'react-json-view';

export type JsonViewerProps = Pick<
	ReactJsonViewProps,
	'collapsed' | 'src' | 'displayDataTypes'
>;

export const JsonViewer = (props: JsonViewerProps) => {
	return (
		<ReactJson
			iconStyle="square"
			displayDataTypes={false}
			collapsed={1}
			{...props}
		/>
	);
};
