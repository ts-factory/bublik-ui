import { Icon } from '../icon';

function RunRunning() {
	return (
		<div className="flex gap-4">
			<Icon name="TriangleExclamationMark" size={48} className="text-primary" />
			<div>
				<h1 className="text-2xl font-bold">Run is in progress</h1>
				<p className="mt-1 text-xl">
					Due to current technical limitations, logs will only be available once
					the entire run — including all tests — has completed.
				</p>
			</div>
		</div>
	);
}

export { RunRunning };
