/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { useRef, useState } from 'react';

import { McpServer, UpdateMcpServerInputs } from '@/shared/types';
import { useUpdateMcpServerMutation } from '@/services/bublik-api';
import { ButtonTw, toast } from '@/shared/tailwind-ui';
import { setErrorsOnForm } from '@/shared/utils';

import { namesToRows, rowsToPatchMap } from './headers';
import {
	McpServerFormHandle,
	McpServerModal
} from './mcp-server-form.component';
import { McpServerFormValues } from './schema';

export interface EditMcpServerContainerProps {
	server: McpServer;
}

export const EditMcpServerContainer = ({
	server
}: EditMcpServerContainerProps) => {
	const [open, setOpen] = useState(false);
	const [updateServer] = useUpdateMcpServerMutation();
	const formRef = useRef<McpServerFormHandle>(null);

	const handleSubmit = async (values: McpServerFormValues) => {
		const form = formRef.current;
		if (!form) return;

		const body: UpdateMcpServerInputs['body'] = {};
		if (values.name !== server.name) body.name = values.name;
		if (values.url !== server.url) body.url = values.url;
		const headers = rowsToPatchMap(values.headers, server.header_names);
		if (Object.keys(headers).length) body.headers = headers;

		try {
			if (Object.keys(body).length) {
				await updateServer({ id: server.id, body }).unwrap();
			}

			setOpen(false);
			toast.success(`Server "${values.name}" updated`);
		} catch (e: unknown) {
			setErrorsOnForm(e, { handle: form });
		}
	};

	return (
		<McpServerModal
			open={open}
			onOpenChange={setOpen}
			title="Edit MCP server"
			description="Stored header values are never shown. Leave a value blank to keep it, enter a new one to replace it, or remove the row to drop the header."
			submitLabel="Save changes"
			defaultValues={{
				name: server.name,
				url: server.url,
				headers: namesToRows(server.header_names)
			}}
			trigger={
				<ButtonTw
					variant="outline"
					size="xss"
					aria-label={`Edit server ${server.name}`}
				>
					Edit
				</ButtonTw>
			}
			onSubmit={handleSubmit}
			ref={formRef}
		/>
	);
};
