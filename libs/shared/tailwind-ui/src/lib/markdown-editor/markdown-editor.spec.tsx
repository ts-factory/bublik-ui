/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MarkdownEditor } from './markdown-editor.component';

function ControlledEditor({ initial = '' }: { initial?: string }) {
	const [value, setValue] = useState(initial);

	return (
		<MarkdownEditor
			label="Description"
			value={value}
			onChange={(event) => setValue(event.target.value)}
		/>
	);
}

describe('MarkdownEditor', () => {
	it('labels the textarea', () => {
		render(<ControlledEditor />);

		expect(screen.getByLabelText('Description')).toBeInstanceOf(
			HTMLTextAreaElement
		);
	});

	it('renders the text as markdown on Preview', async () => {
		const user = userEvent.setup();

		render(<ControlledEditor initial={'**loud**\n\n- one'} />);
		await user.click(screen.getByRole('tab', { name: 'Preview' }));

		const preview = screen.getByTestId('markdown-editor-preview');

		expect(preview.querySelector('strong')).toHaveTextContent('loud');
		expect(preview.querySelector('li')).toHaveTextContent('one');
		expect(screen.getByLabelText('Description')).not.toBeVisible();
	});

	it('says so when there is nothing to preview', async () => {
		const user = userEvent.setup();

		render(<ControlledEditor />);
		await user.click(screen.getByRole('tab', { name: 'Preview' }));

		expect(screen.getByText('Nothing to preview')).toBeVisible();
	});

	it('applies toolbar commands to the selection', async () => {
		const user = userEvent.setup();

		render(<ControlledEditor initial="word" />);
		const textarea = screen.getByLabelText<HTMLTextAreaElement>('Description');

		textarea.setSelectionRange(0, 4);
		await user.click(screen.getByRole('button', { name: 'Bold' }));

		expect(textarea).toHaveValue('**word**');
	});

	it('continues a list on Enter', async () => {
		const user = userEvent.setup();

		render(<ControlledEditor />);
		const textarea = screen.getByLabelText('Description');

		await user.type(textarea, '- a{Enter}b');

		expect(textarea).toHaveValue('- a\n- b');
	});
});
