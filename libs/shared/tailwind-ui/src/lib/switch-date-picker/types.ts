import { DateValue } from '@internationalized/date';

import { RangeValue } from './utils';

export type DateRange = {
	label: string;
	range: RangeValue<DateValue>;
};
