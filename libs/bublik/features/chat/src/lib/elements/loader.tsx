/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { Shimmer } from './shimmer';

/** Shown while a run is in flight but nothing streamed back yet. */
export function Loader({ label = 'Thinking…' }: { label?: string }) {
	return (
		<div className="py-2">
			<Shimmer className="text-[0.8125rem]">{label}</Shimmer>
		</div>
	);
}
