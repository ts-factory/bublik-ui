/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { snapshotUrls } from '../../test/corpus';
import { joinTo, splitTo } from './to';

describe('splitTo', () => {
	it('splits pathname, search and hash, keeping the ? and # prefixes', () => {
		expect(splitTo('/runs/1/report?config=2#top')).toEqual({
			to: '/runs/1/report',
			search: '?config=2',
			hash: '#top'
		});
	});

	it('returns empty strings for the parts that are absent', () => {
		expect(splitTo('/runs')).toEqual({ to: '/runs', search: '', hash: '' });
		expect(splitTo('?page=2')).toEqual({ to: '', search: '?page=2', hash: '' });
		expect(splitTo('#top')).toEqual({ to: '', search: '', hash: '#top' });
		expect(splitTo('')).toEqual({ to: '', search: '', hash: '' });
	});

	it('a ? inside the hash belongs to the hash', () => {
		expect(splitTo('/a#b?c=d')).toEqual({
			to: '/a',
			search: '',
			hash: '#b?c=d'
		});
	});
});

describe('joinTo', () => {
	it('joins the parts, with or without their prefixes', () => {
		expect(joinTo({ to: '/runs', search: '?page=2', hash: '#top' })).toBe(
			'/runs?page=2#top'
		);
		expect(joinTo({ to: '/runs', search: 'page=2', hash: 'top' })).toBe(
			'/runs?page=2#top'
		);
	});

	it('omits empty parts and treats a bare ? or # as empty', () => {
		expect(joinTo({ to: '/runs' })).toBe('/runs');
		expect(joinTo({ to: '/runs', search: '', hash: '' })).toBe('/runs');
		expect(joinTo({ to: '/runs', search: '?', hash: '#' })).toBe('/runs');
		expect(joinTo({ search: '?page=2' })).toBe('/?page=2');
		expect(joinTo({ to: '', hash: '#top' })).toBe('/#top');
	});
});

// Pinned against React Router's parsePath/createPath while both were installed
// (#63); the edge cases above are the ones where the two could disagree.
describe('every URL the app produces', () => {
	const urls = [
		...snapshotUrls(),
		'/runs/1/report/?config=2',
		'/admin/issues?project=1#top',
		'/'
	];

	it.each(urls)('%s splits and joins back to itself', (url) => {
		const { to, search, hash } = splitTo(url);

		expect(to.startsWith('/')).toBe(true);
		expect(search === '' || search.startsWith('?')).toBe(true);
		expect(hash === '' || hash.startsWith('#')).toBe(true);
		expect(joinTo({ to, search, hash })).toBe(url);
	});
});
