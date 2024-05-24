import { RunReport } from './run-report.component';

import testData from './test.json';

function RunReportContainer() {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return <RunReport blocks={testData as unknown as any} />;
}

export { RunReportContainer };
