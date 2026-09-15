/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { config } from '@/bublik/config';
import {
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem
} from '@/shared/tailwind-ui';
import { joinKeyValue } from '@/shared/utils';

import { ParamClassification } from './matrix-analysis';
import { ChipMenu } from './matrix-chip-menu';
import { FACET_ALL } from './result-view.hooks';

export interface MatrixFacetFiltersProps {
	facets: string[];
	facetSel: Record<string, string>;
	values: ParamClassification['values'];
	onChange: (param: string, value: string) => void;
}

/** One "param=value" badge per facet parameter ("filter" facet mode). */
export function MatrixFacetFilters(props: MatrixFacetFiltersProps) {
	const { facets, facetSel, values, onChange } = props;

	if (!facets.length) return null;

	return (
		<div className="flex items-center gap-2 [&>*]:shrink-0">
			{facets.map((param) => {
				const selected = facetSel[param] ?? FACET_ALL;
				const isAll = selected === FACET_ALL;

				return (
					<ChipMenu
						key={param}
						label={joinKeyValue(
							param,
							isAll ? 'ALL' : selected,
							config.keyValueDisplayDelimiter
						)}
						dashed={isAll}
					>
						<DropdownMenuRadioGroup
							value={selected}
							onValueChange={(value) => onChange(param, value)}
						>
							<DropdownMenuRadioItem value={FACET_ALL}>
								ALL
							</DropdownMenuRadioItem>
							{values[param].map((value) => (
								<DropdownMenuRadioItem key={value} value={value}>
									{value}
								</DropdownMenuRadioItem>
							))}
						</DropdownMenuRadioGroup>
					</ChipMenu>
				);
			})}
		</div>
	);
}
