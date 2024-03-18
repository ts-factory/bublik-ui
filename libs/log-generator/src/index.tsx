#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

import { Command } from 'commander';
import { renderToString } from 'react-dom/server';
import postcss from 'postcss';
import { PropsWithChildren } from 'react';

const tailwind = require('tailwindcss');
const fs = require('fs');

interface GenerateCSSConfig {
	html: string;
}

async function getCss({ html }: GenerateCSSConfig) {
	const tailwindConfig = { content: [], theme: { extend: {} }, plugins: [] };
	const sourceCSS = '@tailwind base; @tailwind components; @tailwind utilities';

	const config = {
		presets: [tailwindConfig],
		content: [{ raw: html }]
	};

	return postcss([tailwind(config)]).process(sourceCSS);
}

function App() {
	return <div className="bg-red-500">Hello world</div>;
}

function Root(props: PropsWithChildren<{ css: string }>) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<title>Log Page</title>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<style>{props.css}</style>
			</head>
			<body className="overflow-hidden antialiased font-medium selection:text-white selection:bg-primary text-text-primary bg-bg-body">
				<div id="root">{props.children}</div>
			</body>
		</html>
	);
}

const program = new Command();

program
	.name('Bublik HTML log generator')
	.description('Generate HTML log from JSON');

program.addCommand(
	new Command('generate').action(async () => {
		const html = renderToString(<App />);
		const css = await getCss({ html });
		const fullApp = renderToString(
			<Root css={css.toString()}>
				<App />
			</Root>
		);

		await fs.writeFile('log.html', fullApp, (err: unknown) => {
			console.log(err);
		});
	})
);

program.parse(process.argv);
