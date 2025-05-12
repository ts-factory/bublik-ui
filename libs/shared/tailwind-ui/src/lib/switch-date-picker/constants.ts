import { getLocalTimeZone, today } from '@internationalized/date';

import { DateRange } from './types';

const DEFAULT_RANGES: DateRange[] = [
	{
		label: '1 Week',
		range: {
			start: today(getLocalTimeZone()).add({ weeks: -1 }),
			end: today(getLocalTimeZone())
		}
	},
	{
		label: '2 Weeks',
		range: {
			start: today(getLocalTimeZone()).add({ weeks: -2 }),
			end: today(getLocalTimeZone())
		}
	},
	{
		label: '1 Month',
		range: {
			start: today(getLocalTimeZone()).add({ months: -1 }),
			end: today(getLocalTimeZone())
		}
	},
	{
		label: '3 Months',
		range: {
			start: today(getLocalTimeZone()).add({ months: -3 }),
			end: today(getLocalTimeZone())
		}
	},
	{
		label: '6 Months',
		range: {
			start: today(getLocalTimeZone()).add({ months: -6 }),
			end: today(getLocalTimeZone())
		}
	},
	{
		label: '1 Year',
		range: {
			start: today(getLocalTimeZone()).add({ years: -1 }),
			end: today(getLocalTimeZone())
		}
	}
];

export { DEFAULT_RANGES };
