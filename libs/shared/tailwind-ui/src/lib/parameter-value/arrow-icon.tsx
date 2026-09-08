/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, SVGProps } from 'react';

export const ArrowDown: FC<SVGProps<SVGSVGElement>> = (props) => {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M2.82763 5.16266C3.04198 4.94627 3.38947 4.94479 3.60382 5.16415L8.38822 10.0482C8.60257 10.2668 8.60184 10.62 8.38676 10.8371C8.27995 10.945 8.13949 11 7.99976 11C7.85857 11 7.71811 10.945 7.6113 10.8357L2.8269 5.95163C2.61255 5.73301 2.61328 5.3798 2.82763 5.16266ZM12.3951 5.16423C12.6095 4.94486 12.957 4.94635 13.1713 5.16274C13.3864 5.37987 13.3871 5.73309 13.1735 5.95171L9.99634 9.19533C9.88953 9.30464 9.74834 9.35967 9.60788 9.35967C9.46815 9.35967 9.32769 9.30464 9.22088 9.19682C9.00581 8.97969 9.00507 8.62647 9.21869 8.40785L12.3951 5.16423Z"
				fill="currentColor"
			/>
		</svg>
	);
};
