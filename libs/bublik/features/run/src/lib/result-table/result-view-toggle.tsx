/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { Icon, SegmentedTabs } from '@/shared/tailwind-ui';

import { ResultViewMode } from '../result-matrix/result-view.hooks';

export interface ResultViewToggleProps {
	value: ResultViewMode;
	onChange: (value: ResultViewMode) => void;
	matrixDisabled?: boolean;
}

/**
 * In a narrow toolbar the tabs keep only their icons, as the bar's buttons
 * do. The label is hidden visually but not from the accessibility tree
 * (`sr-only`, not `hidden`), so each tab keeps its name; the tooltip says
 * the rest.
 */
const ICON_CLASS = 'mr-1 toolbar-narrow:mr-0';
const LABEL_CLASS = 'toolbar-narrow:sr-only';

/** List / Matrix switcher for a test's iterations. */
export function ResultViewToggle(props: ResultViewToggleProps) {
	const { value, onChange, matrixDisabled = false } = props;

	return (
		<SegmentedTabs<ResultViewMode>
			aria-label="Iteration view"
			value={value}
			onChange={onChange}
			items={[
				{
					value: 'list',
					tooltip: 'Show iterations as a list',
					label: (
						<>
							<Icon name="PaperListText" size={16} className={ICON_CLASS} />
							<span className={LABEL_CLASS}>List</span>
						</>
					)
				},
				{
					value: 'matrix',
					disabled: matrixDisabled,
					tooltip: matrixDisabled
						? 'Matrix needs at least two varying parameters'
						: 'Cross two parameters in a matrix',
					label: (
						<>
							<Icon name="Category" size={16} className={ICON_CLASS} />
							<span className={LABEL_CLASS}>Matrix</span>
						</>
					)
				}
			]}
		/>
	);
}
