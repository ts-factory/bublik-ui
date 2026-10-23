/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { ReactNode } from 'react';

import { useFeatureFlag } from './feature-flags.hooks';
import { FeatureFlagId } from './feature-flags.registry';

interface FeatureGateProps {
	flag: FeatureFlagId;
	children: ReactNode;
	/** Rendered while the flag is off. */
	fallback?: ReactNode;
}

/** Renders `children` while the flag is on, `fallback` otherwise. */
function FeatureGate({
	flag,
	children,
	fallback = null
}: FeatureGateProps): ReactNode {
	const [enabled] = useFeatureFlag(flag);

	return enabled ? children : fallback;
}

export { FeatureGate };
export type { FeatureGateProps };
