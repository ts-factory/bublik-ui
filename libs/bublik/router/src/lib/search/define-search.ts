/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type { SearchMiddleware } from '@tanstack/react-router';

import type { Codec } from './codecs';

/** A route's search keys, each with its codec. */
type Shape = Record<string, Codec<unknown>>;

/**
 * The typed search of a shape. Every key is optional: TanStack's `search`
 * prop (object form) requires every key of the `validateSearch` return type,
 * so `search={{ page: 2 }}` only compiles this way, and absent stays absent.
 */
type Typed<S extends Shape> = {
	[K in keyof S]?: S[K] extends Codec<infer T> ? T : never;
};

/** The typed search plus the keys the route does not declare, which pass through. */
type Search<S extends Shape> = Typed<S> & Record<string, unknown>;

/** The keys a schema has a default for, which `withDefaults` always fills. */
type Defaulted<S extends Shape, D> = {
	[K in keyof D & keyof S]-?: Exclude<Typed<S>[K], undefined>;
};

// eslint-disable-next-line @typescript-eslint/ban-types
interface SearchSchema<S extends Shape, D extends Typed<S> = {}> {
	/** The declared keys and their codecs, for tests and tooling that enumerate them. */
	shape: S;
	/** Wire → typed. Keeps unknown keys, fills no defaults, never throws. */
	validateSearch: (raw: Record<string, unknown>) => Search<S>;
	/** Typed → wire, run after child routes and the updater, so the router only ever stringifies strings. */
	middlewares: SearchMiddleware<Search<S>>[];
	/** The page's defaults for absent keys, applied at read time (`useSearch({ select })`). */
	withDefaults: (search: Search<S>) => Search<S> & Defaulted<S, D>;
}

/** The typed search a `defineSearch` result validates to. */
type InferSearch<
	D extends { validateSearch: (raw: Record<string, unknown>) => unknown }
> = ReturnType<D['validateSearch']>;

function omitUndefined<T extends object>(value: T): T {
	return Object.fromEntries(
		Object.entries(value).filter(([, item]) => item !== undefined)
	) as T;
}

/**
 * Turns a shape of codecs into a route's `validateSearch`, its search
 * middleware and a `withDefaults` reader.
 *
 * Defaults live here and never in `validateSearch`: the router seeds every
 * navigation with the current match's *validated* search, so a default filled
 * there would be written to the URL on the first unrelated update
 * (`/runs` → `/runs?mode=table&page=2`).
 */
// eslint-disable-next-line @typescript-eslint/ban-types
function defineSearch<S extends Shape, D extends Typed<S> = {}>(
	shape: S,
	defaults: D = {} as D
): SearchSchema<S, D> {
	const validateSearch = (raw: Record<string, unknown>): Search<S> => {
		const out: Record<string, unknown> = { ...raw };

		// Only keys on the wire get a slot: the router hands this object to
		// `{ ...prev, key }` updaters, so an absent key must stay absent for a
		// later write to append it in write order, as `URLSearchParams.set` does.
		for (const key in shape) {
			if (key in raw) out[key] = shape[key].parse(raw[key]);
		}

		return out as Search<S>;
	};

	const middleware: SearchMiddleware<Search<S>> = ({ search, next }) => {
		// Child routes and the functional updater run first.
		const result = next(search);
		const wire: Record<string, unknown> = { ...result };

		// `parse` first: a navigation hands this the validated (typed) search,
		// but a `<Link>` href is built without validation, so a raw wire string
		// (`tv: '0'`, as lib hooks serving several routes and the link builders
		// write it) or a `null` (a "remove") can arrive here too. Every codec
		// parses its own typed value unchanged, so this is a no-op for the
		// typed case and the exact wire bytes for the raw one.
		for (const key in shape) {
			if (key in result) {
				wire[key] = shape[key].serialize(shape[key].parse(result[key]));
			}
		}

		return wire as Search<S>;
	};

	const withDefaults = (search: Search<S>) =>
		({ ...defaults, ...omitUndefined(search) } as Search<S> & Defaulted<S, D>);

	return { shape, validateSearch, middlewares: [middleware], withDefaults };
}

export { defineSearch };
export type { Defaulted, InferSearch, Search, SearchSchema, Shape, Typed };
