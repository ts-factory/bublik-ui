import { useEffect, useState } from 'react';

const usePlatformSpecificCtrl = () => {
	const [isCtrlPressed, setIsCtrlPressed] = useState(false);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			// On macOS, event.metaKey is for the Command key.
			// On Linux, event.ctrlKey is for the Ctrl key.
			if ((event.ctrlKey && !event.metaKey) || event.metaKey) {
				setIsCtrlPressed(true);
			}
		};

		const handleKeyUp = (event: KeyboardEvent) => {
			// If no key is being pressed, reset the state.
			if (!event.metaKey && !event.ctrlKey) {
				setIsCtrlPressed(false);
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	}, []);

	return isCtrlPressed;
};

export { usePlatformSpecificCtrl };
