/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	createContext,
	PropsWithChildren,
	useCallback,
	useContext,
	useMemo,
	useState
} from 'react';

export interface SettingsLogTableContext {
	isWordBreakEnabled?: boolean;
	toggleWordBreak?: (enabled?: boolean) => void;
}

export const SettingContext = createContext<null | SettingsLogTableContext>(
	null
);

export const SettingsContextProvider = (props: PropsWithChildren) => {
	const api = useLogTableBreakWord();

	return (
		<SettingContext.Provider value={api}>
			{props.children}
		</SettingContext.Provider>
	);
};

export const useSettingsContext = () => {
	const context = useContext(SettingContext);

	if (!context)
		throw new Error(
			'useSettingContext must be used inside <SettingContextProvider>'
		);

	return context;
};

export const useLogTableBreakWord = () => {
	const [isWordBreakEnabled, setIsWordBreakEnabled] = useState(true);

	const toggleWordBreak = useCallback((enabled?: boolean) => {
		if (typeof enabled === 'undefined') {
			setIsWordBreakEnabled((prev) => !prev);
		} else {
			setIsWordBreakEnabled(enabled);
		}
	}, []);

	return useMemo<SettingsLogTableContext>(
		() => ({ isWordBreakEnabled, toggleWordBreak }),
		[isWordBreakEnabled, toggleWordBreak]
	);
};
