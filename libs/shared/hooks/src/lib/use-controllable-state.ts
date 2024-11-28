import * as React from 'react';

/**
 * A custom hook that converts a callback to a ref to avoid triggering re-renders when passed as a
 * prop or avoid re-executing effects when passed as a dependency
 */
// eslint-disable-next-line @typescript-eslint/no-empty-function
function useCallbackRef<T extends (...args: any[]) => any>(
	callback: T | undefined
): T {
	const callbackRef = React.useRef(callback);

	React.useEffect(() => {
		callbackRef.current = callback;
	});

	// https://github.com/facebook/react/issues/19240
	return React.useMemo(
		() => ((...args) => callbackRef.current?.(...args)) as T,
		[]
	);
}

export { useCallbackRef };

type UseControllableStateParams<T> = {
	prop?: T | undefined;
	defaultProp?: T | undefined;
	onChange?: (state: T) => void;
};

type SetStateFn<T> = (prevState?: T) => T;

function useControllableState<T>({
	prop,
	defaultProp,
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	onChange = () => {}
}: UseControllableStateParams<T>) {
	const [uncontrolledProp, setUncontrolledProp] = useUncontrolledState({
		defaultProp,
		onChange
	});
	const isControlled = prop !== undefined;
	const value = isControlled ? prop : uncontrolledProp;
	const handleChange = useCallbackRef(onChange);

	const setValue: React.Dispatch<React.SetStateAction<T | undefined>> =
		React.useCallback(
			(nextValue) => {
				if (isControlled) {
					const setter = nextValue as SetStateFn<T>;
					const value =
						typeof nextValue === 'function' ? setter(prop) : nextValue;
					if (value !== prop) handleChange(value as T);
				} else {
					setUncontrolledProp(nextValue);
				}
			},
			[isControlled, prop, setUncontrolledProp, handleChange]
		);

	return [value, setValue] as const;
}

function useUncontrolledState<T>({
	defaultProp,
	onChange
}: Omit<UseControllableStateParams<T>, 'prop'>) {
	const uncontrolledState = React.useState<T | undefined>(defaultProp);
	const [value] = uncontrolledState;
	const prevValueRef = React.useRef(value);
	const handleChange = useCallbackRef(onChange);

	React.useEffect(() => {
		if (prevValueRef.current !== value) {
			handleChange(value as T);
			prevValueRef.current = value;
		}
	}, [value, prevValueRef, handleChange]);

	return uncontrolledState;
}

export { useControllableState };
