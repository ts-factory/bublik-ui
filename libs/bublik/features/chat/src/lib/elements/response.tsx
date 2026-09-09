/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { memo } from 'react';

import { Markdown } from '../markdown';

/**
 * Assistant text renderer. Memoized so finished messages don't re-render the
 * whole markdown tree on every streamed token of the message below them.
 */
export const Response = memo(function Response({
	children
}: {
	children: string;
}) {
	return <Markdown>{children}</Markdown>;
});
