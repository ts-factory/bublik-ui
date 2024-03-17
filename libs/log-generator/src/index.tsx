#!/usr/bin/env node

import { Command } from 'commander';
import { renderToString } from 'react-dom/server';

function ExampleApp() {
	return <div>Hello world</div>;
}

const program = new Command();

program
	.name('Bublik HTML log generator')
	.description('Generate HTML log from JSON');

program.addCommand(
	new Command('generate').action(() => {
		console.log(renderToString(<ExampleApp />));
	})
);

program.parse(process.argv);
