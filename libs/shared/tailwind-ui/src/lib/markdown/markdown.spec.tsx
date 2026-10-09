/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { Markdown } from './markdown';

/** The rendered HTML, without the newlines react-markdown puts between tags. */
function html(text: string, breaks: boolean) {
	const { container } = render(<Markdown breaks={breaks}>{text}</Markdown>);

	return container.firstElementChild?.innerHTML.replace(/>\n/g, '>');
}

describe('Markdown breaks', () => {
	it('folds newlines and blank-line runs away without it', () => {
		expect(html('a\nb\n\n\n\nc', false)).toBe('<p>a\nb</p><p>c</p>');
	});

	it('renders a newline as a line break', () => {
		expect(html('a\nb', true)).toBe('<p>a<br>b</p>');
	});

	it('keeps each blank line past the first as an empty line', () => {
		expect(html('a\n\n\n\nc', true)).toBe(
			'<p>a</p><p><br></p><p><br></p><p>c</p>'
		);
	});

	it('leaves code blocks alone', () => {
		expect(html('```\nx\ny\n```', true)).toContain('x\ny');
	});
});
