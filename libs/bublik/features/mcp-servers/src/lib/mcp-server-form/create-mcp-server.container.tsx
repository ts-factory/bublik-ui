/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { useRef, useState } from 'react';

import { useCreateMcpServerMutation } from '@/services/bublik-api';
import { ButtonTw, toast } from '@/shared/tailwind-ui';
import { setErrorsOnForm } from '@/shared/utils';

import { rowsToCreateMap } from './headers';
import {
	McpServerFormHandle,
	McpServerModal
} from './mcp-server-form.component';
import { McpServerFormValues } from './schema';

export const CreateMcpServerContainer = () => {
	const [open, setOpen] = useState(false);
	const [createServer] = useCreateMcpServerMutation();
	const formRef = useRef<McpServerFormHandle>(null);

	const handleSubmit = async (values: McpServerFormValues) => {
		const form = formRef.current;
		if (!form) return;

		try {
			await createServer({
				name: values.name,
				url: values.url,
				headers: rowsToCreateMap(values.headers)
			}).unwrap();

			setOpen(false);
			toast.success(`Server "${values.name}" added`);
		} catch (e: unknown) {
			setErrorsOnForm(e, { handle: form });
		}
	};

	return (
		<McpServerModal
			open={open}
			onOpenChange={setOpen}
			title="New MCP server"
			description="A Streamable HTTP MCP server whose tools the assistant can use in your chats. Only hosts your administrator allowed are accepted."
			submitLabel="Add server"
			trigger={
				<ButtonTw variant="primary" size="xs">
					New server
				</ButtonTw>
			}
			onSubmit={handleSubmit}
			ref={formRef}
		/>
	);
};
