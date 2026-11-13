/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useGetServerFeaturesQuery } from '@/services/bublik-api';

import { ChatRouteGate } from './chat-route-gate';

vi.mock('@/services/bublik-api', () => ({
	useGetServerFeaturesQuery: vi.fn()
}));

vi.mock('@/bublik/features/ui-state', () => ({
	BublikEmptyState: ({ title }: { title: ReactNode }) => <p>{title}</p>
}));

vi.mock('@/shared/tailwind-ui', () => ({
	Spinner: () => <span role="progressbar" />
}));

type FeaturesQueryResult = ReturnType<typeof useGetServerFeaturesQuery>;

function mockFeatures(result: Partial<FeaturesQueryResult>) {
	vi.mocked(useGetServerFeaturesQuery).mockReturnValue(
		result as FeaturesQueryResult
	);
}

function renderGate() {
	return render(
		<ChatRouteGate>
			<div>chat feature</div>
		</ChatRouteGate>
	);
}

const DISABLED_TEXT = 'Chat is not enabled on this server';

describe('ChatRouteGate', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it('renders the chat when chat is enabled', () => {
		mockFeatures({
			data: { analytics_enabled: false, chat_enabled: true },
			isLoading: false
		});

		renderGate();

		expect(screen.getByText('chat feature')).toBeTruthy();
		expect(screen.queryByText(DISABLED_TEXT)).toBeNull();
	});

	it('shows the disabled state instead of the chat when chat is disabled', () => {
		mockFeatures({
			data: { analytics_enabled: false, chat_enabled: false },
			isLoading: false
		});

		renderGate();

		expect(screen.getByText(DISABLED_TEXT)).toBeTruthy();
		expect(screen.queryByText('chat feature')).toBeNull();
	});

	it('shows neither the chat nor the disabled state while features load', () => {
		mockFeatures({ data: undefined, isLoading: true });

		renderGate();

		expect(screen.getByRole('progressbar')).toBeTruthy();
		expect(screen.queryByText(DISABLED_TEXT)).toBeNull();
		expect(screen.queryByText('chat feature')).toBeNull();
	});
});
