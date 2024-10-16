/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import {
	ComponentProps,
	forwardRef,
	useImperativeHandle,
	useRef,
	useState
} from 'react';
import MonacoEditor, { Monaco, OnMount } from '@monaco-editor/react';
import { format } from 'prettier';
import parserJson from 'prettier/parser-babel';

import {
	ButtonTw,
	CardHeader,
	cn,
	Icon,
	toast,
	Tooltip
} from '@/shared/tailwind-ui';

import { DEFAULT_URI } from '../config.constants';

function formatJson(value: string) {
	return format(value, { parser: 'json', plugins: [parserJson] });
}

// MARK: Editor
interface ConfigEditorProps extends ComponentProps<typeof MonacoEditor> {
	schema?: Record<string, unknown>;
	label?: ComponentProps<typeof CardHeader>['label'];
}

const ConfigEditor = forwardRef<Monaco | undefined, ConfigEditorProps>(
	({ schema, label, className, ...props }, ref) => {
		const [monaco, setMonaco] = useState<Monaco>();
		const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

		useImperativeHandle(ref, () => monaco, [monaco]);

		function handleEditorWillMount(monaco: Monaco) {
			monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
				validate: true,
				schemas: [{ fileMatch: ['*'], schema: schema, uri: '' }]
			});
			monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
			setMonaco(monaco);
		}

		const handleEditorDidMount: OnMount = (editor, monaco) => {
			editorRef.current = editor;

			editor.addCommand(
				monaco.KeyMod.CtrlCmd | monaco.KeyCode.Backslash,
				() => {
					editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
				}
			);
		};

		function handleFormatClick() {
			const URI = monaco?.Uri.parse(DEFAULT_URI);
			if (!URI) {
				toast.error('Failed to create URI');
				return;
			}

			const model = monaco?.editor.getModel(URI);

			if (!model) {
				toast.error(`Failed to get model by ${URI}`);
				return;
			}

			const value = model.getValue();
			try {
				const formatted = formatJson(value);
				model.setValue(formatted);
			} catch (error) {
				toast.error('Failed to format JSON');
				console.error(error);
			}
		}

		return (
			<div className="flex flex-col h-full">
				<CardHeader label={label ?? 'Editor'}>
					<div className="flex items-center gap-4">
						<Tooltip content="Format JSON">
							<ButtonTw
								variant="secondary"
								size="xss"
								onClick={handleFormatClick}
							>
								<Icon name="Edit" className="size-5 mr-1.5" />
								<span>Format</span>
							</ButtonTw>
						</Tooltip>
					</div>
				</CardHeader>
				<div className={cn('flex-1', className)}>
					<MonacoEditor
						language="json"
						path={DEFAULT_URI}
						beforeMount={handleEditorWillMount}
						onMount={handleEditorDidMount}
						options={{ fontSize: 14 }}
						loading={null}
						{...props}
					/>
				</div>
			</div>
		);
	}
);

export { ConfigEditor, formatJson };
