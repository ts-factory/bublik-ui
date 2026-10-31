/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import {
	CSSProperties,
	ReactNode,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState
} from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../utils';

/** What the dock knows of one selection popover in it. */
interface DockEntry {
	isOpen: () => boolean;
	close: () => void;
}

interface SelectionDockContextValue {
	/** The element the pills are portaled into; null until it has mounted. */
	container: HTMLElement | null;
	register: (id: string, entry: DockEntry) => () => void;
	/** Says `id` opened its panel, which closes every other one. */
	announceOpen: (id: string) => void;
	/** Lifts the dock for as long as the returned cleanup is not called. */
	raise: () => () => void;
}

const SelectionDockContext = createContext<SelectionDockContextValue | null>(
	null
);

/**
 * Bottom right, a column pinned by its foot that grows upwards: the pills
 * stack one above the other, right-aligned, the higher `order` lower down. The dock is what an open panel is placed against, so
 * it opens above the whole stack and covers none of the pills. The column
 * lets clicks through between its pills.
 */
function dockClassName(raised: boolean): string {
	return cn(
		'fixed right-4 z-40 flex flex-col items-end gap-2 max-w-[calc(100vw-2rem)] pointer-events-none',
		// Clear of a bar pinned to the page's bottom edge, as on the issue
		// pages, which page their results with one.
		raised ? 'bottom-16' : 'bottom-4'
	);
}

interface SelectionDockProviderProps {
	children: ReactNode;
}

/**
 * The one place the page's selection popovers dock: the runs selection, the
 * results selection, the charts selections. Each one's pill goes into a
 * shared stack at the bottom right, and its panel opens above the stack;
 * only one panel is open at a time, so opening one closes the others.
 * Mounted once, in the app's layout; a popover outside it docks alone.
 */
function SelectionDockProvider({ children }: SelectionDockProviderProps) {
	const [container, setContainer] = useState<HTMLDivElement | null>(null);
	const entries = useRef(new Map<string, DockEntry>());
	const [raisedBy, setRaisedBy] = useState(0);

	const register = useCallback((id: string, entry: DockEntry) => {
		entries.current.set(id, entry);

		return () => {
			entries.current.delete(id);
		};
	}, []);

	const announceOpen = useCallback((id: string) => {
		entries.current.forEach((entry, other) => {
			if (other !== id && entry.isOpen()) entry.close();
		});
	}, []);

	const raise = useCallback(() => {
		setRaisedBy((count) => count + 1);

		return () => setRaisedBy((count) => count - 1);
	}, []);

	const value = useMemo(
		() => ({ container, register, announceOpen, raise }),
		[container, register, announceOpen, raise]
	);

	return (
		<SelectionDockContext.Provider value={value}>
			<div
				ref={setContainer}
				className={dockClassName(raisedBy > 0)}
				data-testid="selection-dock"
			/>
			{children}
		</SelectionDockContext.Provider>
	);
}

/**
 * Keeps one panel of the dock open: when this one opens, mounted open
 * included, the others close. The latest to open wins.
 */
function useSelectionDockExclusive(
	isOpen: boolean,
	setOpen: (open: boolean) => void
): void {
	const dock = useContext(SelectionDockContext);
	const id = useId();
	const isOpenRef = useRef(isOpen);
	const setOpenRef = useRef(setOpen);

	isOpenRef.current = isOpen;
	setOpenRef.current = setOpen;

	useEffect(
		() =>
			dock?.register(id, {
				isOpen: () => isOpenRef.current,
				close: () => setOpenRef.current(false)
			}),
		[dock, id]
	);

	useEffect(() => {
		if (isOpen) dock?.announceOpen(id);
	}, [dock, id, isOpen]);
}

interface SelectionDockSlotProps {
	children: ReactNode;
	/** Lift the whole dock clear of a bar pinned to the page's bottom edge. */
	raised?: boolean;
	/** Where in the stack the pill sits: higher is further down. */
	order?: number;
}

/**
 * One popover's place in the dock: its pill, and its panel, which is placed
 * against the dock rather than the pill. Outside a `SelectionDockProvider`
 * the popover gets a dock of its own.
 */
function SelectionDockSlot({
	children,
	raised = false,
	order = 0
}: SelectionDockSlotProps) {
	const dock = useContext(SelectionDockContext);

	useEffect(() => (dock && raised ? dock.raise() : undefined), [dock, raised]);

	const style: CSSProperties = { order };
	const item = (
		<div
			className="flex pointer-events-auto"
			style={style}
			data-testid="selection-dock-item"
		>
			{children}
		</div>
	);

	if (!dock) return <div className={dockClassName(raised)}>{item}</div>;

	return dock.container ? createPortal(item, dock.container) : null;
}

export { SelectionDockProvider, SelectionDockSlot, useSelectionDockExclusive };
export type { SelectionDockProviderProps, SelectionDockSlotProps };
