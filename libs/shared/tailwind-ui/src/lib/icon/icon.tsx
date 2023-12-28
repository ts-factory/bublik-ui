/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { SVGProps, forwardRef } from 'react';

import * as Icons from '@/icons';

type IconNames = keyof typeof Icons;

export interface IconProps extends SVGProps<SVGSVGElement> {
	name: IconNames;
	size?: number;
}

export const Icon = forwardRef<SVGSVGElement, IconProps>((props, ref) => {
	const {
		name,
		width: propWidth,
		height: propHeight,
		size,
		...restProps
	} = props;

	const SVGComp = Icons[name];

	if (size && (propWidth || propHeight)) {
		throw new Error("Can't pass size with height or width prop");
	}

	const dimensions = size ? { width: size, height: size } : undefined;

	return <SVGComp {...restProps} {...dimensions} ref={ref} />;
});
Icon.displayName = 'Icon';
