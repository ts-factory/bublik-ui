/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, it, expect } from 'vitest';
import {
	calculateAbsoluteTimestamp,
	calculateAbsoluteTestTimes,
	formatTimestampToFull,
	formatDurationWithMs
} from './time';
describe('calculateAbsoluteTimestamp', () => {
	it('should calculate timestamp for same-day test', () => {
		const runStart = '2025-09-23T21:15:39Z';
		const testStart = '21:18:42.869';
		const result = calculateAbsoluteTimestamp(runStart, testStart);
		expect(result.toISOString()).toBe('2025-09-23T21:18:42.869Z');
	});
	it('should handle test time after midnight (next day)', () => {
		const runStart = '2025-09-23T21:15:39Z';
		const testEnd = '00:05:00.000';
		const result = calculateAbsoluteTimestamp(runStart, testEnd);
		expect(result.toISOString()).toBe('2025-09-24T00:05:00.000Z');
	});
	it('should preserve milliseconds', () => {
		const runStart = '2025-09-23T21:15:39.123Z';
		const testStart = '21:18:42.869';
		const result = calculateAbsoluteTimestamp(runStart, testStart);
		expect(result.getMilliseconds()).toBe(869);
	});
	it('should handle run at midnight edge', () => {
		const runStart = '2025-09-23T00:00:00Z';
		const testStart = '23:59:59.999';
		const result = calculateAbsoluteTimestamp(runStart, testStart);
		expect(result.toISOString()).toBe('2025-09-23T23:59:59.999Z');
	});
});
describe('calculateAbsoluteTestTimes', () => {
	it('should calculate same-day test timestamps', () => {
		const runStart = '2025-09-23T21:15:39Z';
		const result = calculateAbsoluteTestTimes(
			runStart,
			'21:18:42.000',
			'21:18:45.000'
		);
		expect(result.start.toISOString()).toBe('2025-09-23T21:18:42.000Z');
		expect(result.end?.toISOString()).toBe('2025-09-23T21:18:45.000Z');
	});
	it('should handle test spanning midnight', () => {
		const runStart = '2025-09-23T21:15:39Z';
		const result = calculateAbsoluteTestTimes(
			runStart,
			'23:59:00.000',
			'00:05:00.000'
		);
		expect(result.start.toISOString()).toBe('2025-09-23T23:59:00.000Z');
		expect(result.end?.toISOString()).toBe('2025-09-24T00:05:00.000Z');
	});
	it('should handle missing end time', () => {
		const runStart = '2025-09-23T21:15:39Z';
		const result = calculateAbsoluteTestTimes(runStart, '21:18:42.000');
		expect(result.start).toBeDefined();
		expect(result.end).toBeUndefined();
	});
});
describe('formatTimestampToFull', () => {
	it('should format timestamp with timezone', () => {
		const date = '2025-09-23T21:18:42.869Z';
		const result = formatTimestampToFull(date);
		expect(result).toMatch(/September 2[34], 2025/);
		expect(result).toMatch(/\d{2}:\d{2}:\d{2}\.\d{3}/);
		expect(result).toMatch(/GMT/);
	});
	it('should handle Date object input', () => {
		const date = new Date('2025-09-23T21:18:42.869Z');
		const result = formatTimestampToFull(date);
		expect(result).toMatch(/September 2[34], 2025/);
		expect(result).toMatch(/\d{2}:\d{2}:\d{2}\.\d{3}/);
	});
	it('should return N/A for undefined', () => {
		const result = formatTimestampToFull(undefined);
		expect(result).toBe('N/A');
	});
	it('should return N/A for null', () => {
		const result = formatTimestampToFull(
			null as unknown as string | Date | undefined
		);
		expect(result).toBe('N/A');
	});
});
describe('formatDurationWithMs', () => {
	it('should format seconds only duration', () => {
		const result = formatDurationWithMs('0:0:1.456');
		expect(result).toBe('1.456s');
	});
	it('should format hours:minutes:seconds duration', () => {
		const result = formatDurationWithMs('4:18:58.254');
		expect(result).toBe('4h 18m 58.254s');
	});
	it('should format multi-hour duration (>24h)', () => {
		const result = formatDurationWithMs('28:18:58.000');
		expect(result).toBe('28h 18m 58s');
	});
	it('should return N/A for undefined', () => {
		const result = formatDurationWithMs(undefined);
		expect(result).toBe('N/A');
	});
	it('should return original string if format is invalid', () => {
		const result = formatDurationWithMs('invalid');
		expect(result).toBe('invalid');
	});
});
describe('Multi-day test timestamp integration', () => {
	it('should correctly format test spanning midnight', () => {
		const runStart = '2025-09-23T21:15:39Z';
		const testMeta = {
			start: '23:59:00.000',
			end: '00:05:00.000',
			duration: '0:0:6.000'
		};
		const absoluteTimes = calculateAbsoluteTestTimes(
			runStart,
			testMeta.start,
			testMeta.end
		);
		expect(absoluteTimes.start.toISOString()).toBe('2025-09-23T23:59:00.000Z');
		expect(absoluteTimes.end?.toISOString()).toBe('2025-09-24T00:05:00.000Z');
		const formattedStart = formatTimestampToFull(absoluteTimes.start);
		const formattedEnd = absoluteTimes.end
			? formatTimestampToFull(absoluteTimes.end)
			: 'N/A';
		const formattedDuration = formatDurationWithMs(testMeta.duration);
		expect(formattedStart).toMatch(/September 2[34]/);
		expect(formattedEnd).toMatch(/September 2[45]/);
		expect(formattedDuration).toBe('6s');
	});
});
