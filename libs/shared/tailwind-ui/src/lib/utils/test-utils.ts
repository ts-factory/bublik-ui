/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
export const replaceReactAriaIds = (container: HTMLElement) => {
	const selectors = ['id', 'for', 'aria-labelledby'];
	const ariaSelector = (el: string) => `[${el}^="react-aria"]`;
	const regexp = /react-aria\d+-\d+/g;
	const staticId = 'static-id';

	/**
	 * keep a map of the replaceIds to keep the matching between input "id" and label "for" attributes
	 */
	const attributesMap: Record<string, string> = {};

	container
		.querySelectorAll(selectors.map(ariaSelector).join(', '))
		.forEach((el, index) => {
			selectors.forEach((selector) => {
				const attr = el.getAttribute(selector);

				if (attr?.match(regexp)) {
					const newAttr = `${staticId}-${index}`;

					el.setAttribute(selector, attributesMap[attr] || newAttr);

					attributesMap[attr] = newAttr;
				}
			});
		});
};
