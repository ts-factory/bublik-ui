/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { fireEvent, render } from '@testing-library/react';

import { usePhysicalHotkeys } from './use-physical-hotkeys';

function TestHotkey(props: { onHotkey: () => void }) {
	usePhysicalHotkeys(
		[
			{
				code: 'KeyJ',
				callback: props.onHotkey
			}
		],
		{ requireReset: true }
	);

	return <input aria-label="input" />;
}

function RepeatableHotkey(props: { onHotkey: () => void }) {
	usePhysicalHotkeys([
		{
			code: 'KeyJ',
			callback: props.onHotkey
		}
	]);

	return null;
}

describe('usePhysicalHotkeys', () => {
	it('matches physical key code when keyboard layout changes event.key', () => {
		const onHotkey = vi.fn();

		render(<TestHotkey onHotkey={onHotkey} />);

		fireEvent.keyDown(document, { code: 'KeyJ', key: 'о' });

		expect(onHotkey).toHaveBeenCalledTimes(1);
	});

	it('ignores input targets by default', () => {
		const onHotkey = vi.fn();
		const { getByLabelText } = render(<TestHotkey onHotkey={onHotkey} />);

		fireEvent.keyDown(getByLabelText('input'), { code: 'KeyJ', key: 'о' });

		expect(onHotkey).not.toHaveBeenCalled();
	});

	it('requires key reset when configured', () => {
		const onHotkey = vi.fn();

		render(<TestHotkey onHotkey={onHotkey} />);

		fireEvent.keyDown(document, { code: 'KeyJ', key: 'о' });
		fireEvent.keyDown(document, { code: 'KeyJ', key: 'о' });
		fireEvent.keyUp(document, { code: 'KeyJ', key: 'о' });
		fireEvent.keyDown(document, { code: 'KeyJ', key: 'о' });

		expect(onHotkey).toHaveBeenCalledTimes(2);
	});

	it('handles repeated keydown events by default', () => {
		const onHotkey = vi.fn();

		render(<RepeatableHotkey onHotkey={onHotkey} />);

		fireEvent.keyDown(document, { code: 'KeyJ', key: 'о' });
		fireEvent.keyDown(document, { code: 'KeyJ', key: 'о' });

		expect(onHotkey).toHaveBeenCalledTimes(2);
	});
});
