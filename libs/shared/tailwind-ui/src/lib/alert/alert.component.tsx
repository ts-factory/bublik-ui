/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	ComponentPropsWithRef,
	PropsWithChildren,
	createContext,
	forwardRef,
	useContext,
	useMemo
} from 'react';

import { VariantProps, cn, cva } from '../utils';

interface AlertContext {
	type?: VariantProps<typeof rootStyle>['type'];
	size?: VariantProps<typeof rootStyle>['size'];
}

const AlertContext = createContext<AlertContext | null>(null);

const useAlertContext = () => {
	const context = useContext(AlertContext);

	if (!context) {
		throw new Error('Must use useAlertContext inside <AlertContextProvider />');
	}

	return context;
};

const AlertContextProvider = ({
	value,
	children
}: PropsWithChildren<{ value: AlertContext }>) => {
	return (
		<AlertContext.Provider value={value}>{children}</AlertContext.Provider>
	);
};

const rootStyle = cva({
	variants: {
		type: {
			error: ['bg-bg-fillError'],
			warn: [],
			info: []
		},
		size: {
			default: 'rounded-lg p-2.5'
		}
	},
	defaultVariants: {
		type: 'info',
		size: 'default'
	}
});

type RootProps = ComponentPropsWithRef<'div'> & VariantProps<typeof rootStyle>;

const Root = forwardRef<HTMLDivElement, RootProps>(
	({ children, className, type, size, ...props }, ref) => {
		const api = useMemo(() => ({ type, size }), [size, type]);

		return (
			<AlertContextProvider value={api}>
				<div
					{...props}
					className={cn(rootStyle({ type }), className)}
					ref={ref}
				>
					{children}
				</div>
			</AlertContextProvider>
		);
	}
);

const titleStyle = cva({
	variants: {
		type: {
			error: [''],
			warn: [],
			info: []
		},
		size: {
			default: ['font-body', 'text-sm', 'font-medium']
		}
	},
	defaultVariants: {
		type: 'info',
		size: 'default'
	}
});

type TitleProps = ComponentPropsWithRef<'p'>;

const Title = forwardRef<HTMLHeadingElement, TitleProps>(
	({ children, className, ...props }, ref) => {
		const { type, size } = useAlertContext();

		return (
			<h2
				{...props}
				className={cn(titleStyle({ type, size }), className)}
				ref={ref}
			>
				{children}
			</h2>
		);
	}
);

const descriptionStyle = cva({
	variants: {
		type: {
			error: [''],
			warn: [],
			info: []
		},
		size: {
			default: ['font-body', 'text-xs', 'font-medium']
		}
	},
	defaultVariants: {
		type: 'info',
		size: 'default'
	}
});

type DescriptionProps = ComponentPropsWithRef<'p'>;

const Description = forwardRef<HTMLParagraphElement, DescriptionProps>(
	({ children, className, ...props }, ref) => {
		const { type, size } = useAlertContext();

		return (
			<p
				{...props}
				className={cn(descriptionStyle({ type, size }), className)}
				ref={ref}
			>
				{children}
			</p>
		);
	}
);

export const Alert = { Root, Description, Title };
