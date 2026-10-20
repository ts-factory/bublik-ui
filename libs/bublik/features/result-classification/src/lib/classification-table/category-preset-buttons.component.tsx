/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import {
	ButtonTw,
	Icon,
	TOOLBAR_BUTTON_CLASS,
	TOOLBAR_ICON_CLASS,
	TOOLBAR_LABEL_CLASS,
	Tooltip,
	cn
} from '@/shared/tailwind-ui';

import {
	CATEGORY_PRESETS,
	type CategoryPresetId,
	isPresetActive,
	isPresetAvailable
} from '../classification/category-presets';

/**
 * Each half's hue: red for what still has to be fixed, green for what is
 * accounted for, the hue its results are proposed as. The icon carries it;
 * pressed, the label, a faint wash and a softened border take it too.
 */
const PRESET_TONE: Record<CategoryPresetId, { icon: string; pressed: string }> =
	{
		attention: {
			icon: 'text-text-unexpected',
			pressed:
				'bg-text-unexpected/10 hover:bg-text-unexpected/15 border-text-unexpected/40 text-text-unexpected'
		},
		explained: {
			icon: 'text-text-expected',
			pressed:
				'bg-text-expected/10 hover:bg-text-expected/15 border-text-expected/40 text-text-expected'
		}
	};

export interface CategoryPresetButtonsProps {
	/** The Category filter as it stands. */
	value: readonly string[];
	/** `undefined` clears the filter, as `facetControls.set` reads it. */
	onChange: (next: string[] | undefined) => void;
	/** Prefixes each button's test id: `<prefix>-preset-<preset id>`. */
	testIdPrefix: string;
	/**
	 * The categories the listed rows carry. A preset none of whose categories
	 * is among them is disabled, as pressing it could match nothing. Left out,
	 * every preset stays enabled: a server answering the filters knows more
	 * rows than are loaded.
	 */
	availableCategories?: readonly string[];
}

/**
 * One button per category preset, set among the filters as a shortcut for the
 * Category one and outlined like them, tinted with its half's hue while
 * pressed. A button is pressed while the filter is exactly its categories;
 * pressing it again clears the filter, and any other selection — a preset plus
 * one more, a single category — leaves both up. A pressed preset is never
 * disabled, so it can always be cleared.
 */
export function CategoryPresetButtons({
	value,
	onChange,
	testIdPrefix,
	availableCategories
}: CategoryPresetButtonsProps) {
	return (
		<div className="flex items-center gap-1">
			{CATEGORY_PRESETS.map((preset) => {
				const isActive = isPresetActive(preset, value);
				const isDisabled =
					!isActive &&
					availableCategories !== undefined &&
					!isPresetAvailable(preset, availableCategories);
				const tone = PRESET_TONE[preset.id];

				return (
					<Tooltip
						key={preset.id}
						content={
							isDisabled
								? `${preset.description} None of the listed results carries these categories.`
								: `${preset.description}${
										isActive ? ' Click again to clear the filter.' : ''
								  }`
						}
					>
						{/* A disabled button takes no pointer events, so the span is
						    what the tooltip opens from. */}
						<span className="inline-flex">
							<ButtonTw
								variant="outline-secondary"
								size="xss"
								aria-pressed={isActive}
								aria-label={preset.label}
								className={cn(TOOLBAR_BUTTON_CLASS, isActive && tone.pressed)}
								disabled={isDisabled}
								onClick={() =>
									onChange(isActive ? undefined : [...preset.categories])
								}
								data-testid={`${testIdPrefix}-preset-${preset.id}`}
							>
								<Icon
									name={preset.iconName}
									size={20}
									// Disabled, the icon greys out with the label.
									className={cn(TOOLBAR_ICON_CLASS, !isDisabled && tone.icon)}
								/>
								<span className={TOOLBAR_LABEL_CLASS}>{preset.label}</span>
							</ButtonTw>
						</span>
					</Tooltip>
				);
			})}
		</div>
	);
}
