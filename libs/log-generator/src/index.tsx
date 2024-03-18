#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

import { Command } from 'commander';
import { renderToString } from 'react-dom/server';
import postcss from 'postcss';
import { PropsWithChildren, useState } from 'react';

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
	const [count, setCount] = useState(0);

	return (
		<div className="w-screen h-screen flex items-center justify-center">
			<button onClick={() => setCount(count + 1)}>{count}</button>
		</div>
	);
}

function Root(props: PropsWithChildren<{ css: string }>) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<title>Log Page</title>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
				<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
				<script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>
				<style>{props.css}</style>
			</head>
			<body className="overflow-hidden antialiased font-medium selection:text-white selection:bg-primary text-text-primary bg-bg-body">
				<div id="root">{props.children}</div>
				<script
					type="text/babel"
					dangerouslySetInnerHTML={{
						__html: `
            function App() {
              const [count, setCount] = React.useState(0);

              return (
                <div className="w-screen h-screen flex items-center justify-center">
                  <button onClick={() => setCount(count + 1)}>{count}</button>
                </div>
              );
            }

            ReactDOM.hydrateRoot(document.getElementById('root'), <App/>);
`
					}}
				></script>
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
