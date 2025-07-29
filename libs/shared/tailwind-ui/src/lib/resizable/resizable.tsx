/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ResizableProps } from 're-resizable';

export const resizableStyles: ResizableProps = {
	handleStyles: {
		right: { width: 4, right: -4 },
		bottom: { height: 4, bottom: -4 }
	},
	handleClasses: {
		right:
			'bg-transparent rounded-full transition-colors z-20 hover:bg-primary active:bg-primary',
		bottom:
			'bg-transparent rounded-full transition-colors z-20 hover:bg-primary active:bg-primary'
	}
};

export { Resizable } from 're-resizable';
