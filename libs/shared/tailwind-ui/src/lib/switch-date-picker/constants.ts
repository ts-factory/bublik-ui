import { getLocalTimeZone, today } from '@internationalized/date';

import { DateRange } from './types';

const DEFAULT_RANGES: DateRange[] = [
	{
		label: 'One Week',
		range: {
			start: today(getLocalTimeZone()).add({ weeks: -1 }),
			end: today(getLocalTimeZone())
		}
	},
	{
		label: 'Two Weeks',
		range: {
			start: today(getLocalTimeZone()).add({ weeks: -2 }),
			end: today(getLocalTimeZone())
		}
	},
	{
		label: 'One Month',
		range: {
			start: today(getLocalTimeZone()).add({ months: -1 }),
			end: today(getLocalTimeZone())
		}
	},
	{
		label: 'Three Months',
		range: {
			start: today(getLocalTimeZone()).add({ months: -3 }),
			end: today(getLocalTimeZone())
		}
	},
	{
		label: 'Six Months',
		range: {
			start: today(getLocalTimeZone()).add({ months: -6 }),
			end: today(getLocalTimeZone())
		}
	},
	{
		label: 'One Year',
		range: {
			start: today(getLocalTimeZone()).add({ years: -1 }),
			end: today(getLocalTimeZone())
		}
	}
];

export { DEFAULT_RANGES };
