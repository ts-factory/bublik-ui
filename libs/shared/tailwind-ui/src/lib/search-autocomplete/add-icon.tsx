/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { SVGProps } from 'react';

export const AddIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		width={24}
		height={24}
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		{...props}
	>
		<path
			d="M12.005 6.565a.664.664 0 0 0-.664.665l-.005 4.605h-4.61a.664.664 0 1 0 0 1.33h4.61v4.61a.664.664 0 1 0 1.33 0v-4.61h4.61a.664.664 0 1 0 0-1.33h-4.61v-4.61a.668.668 0 0 0-.66-.66Z"
			fill="currentColor"
		/>
	</svg>
);
