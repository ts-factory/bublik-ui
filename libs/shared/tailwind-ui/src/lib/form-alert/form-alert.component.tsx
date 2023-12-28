/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	ComponentPropsWithRef,
	createContext,
	forwardRef,
	PropsWithChildren,
	ReactNode,
	useContext,
	useMemo
} from 'react';

import { Icon as InternalIcon } from '../icon';
import { cn, cva, VariantProps } from '../utils';

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
			error: 'bg-bg-fillError',
			warn: 'bg-bg-fillWarning',
			info: []
		},
		size: {
			default: 'rounded-lg p-2.5',
			xl: 'rounded-lg p-2.5'
		}
	},
	defaultVariants: {
		type: 'error',
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
	base: ['overflow-wrap-anywhere'],
	variants: {
		type: { error: [], warn: [], info: [] },
		size: {
			default: ['font-body', 'text-sm', 'font-medium'],
			xl: 'text-xl font-body font-medium'
		}
	},
	defaultVariants: {
		type: 'error',
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
	base: ['overflow-wrap-anywhere'],
	variants: {
		type: {
			error: [],
			warn: [],
			info: []
		},
		size: {
			default: ['font-body', 'text-xs', 'font-medium'],
			xl: 'font-body text-sm font-medium'
		}
	},
	defaultVariants: {
		type: 'error',
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

const iconStyles = cva({
	base: ['grid place-items-center'],
	variants: {
		type: {
			error: ['text-text-unexpected'],
			warn: ['text-bg-warning'],
			info: []
		},
		size: { default: [], xl: '' }
	},
	defaultVariants: {
		type: 'error',
		size: 'default'
	}
});

type IconProps = ComponentPropsWithRef<'div'>;

const Icon = forwardRef<HTMLDivElement, IconProps>(
	({ className, children, ...props }, ref) => {
		const { type, size } = useAlertContext();

		return (
			<div
				{...props}
				className={cn(iconStyles({ type, size }), className)}
				ref={ref}
			>
				{children}
			</div>
		);
	}
);
export const FormAlert = { Root, Description, Title, Icon };

type FormAlertErrorProsp = {
	title: string;
	description?: string;
	icon?: ReactNode;
};

export const FormAlertError = ({
	title,
	description,
	icon
}: FormAlertErrorProsp) => {
	return (
		<FormAlert.Root className="flex flex-col gap-2">
			<div className="flex items-start gap-4">
				<FormAlert.Icon>
					{icon ? (
						icon
					) : (
						<InternalIcon name="TriangleExclamationMark" size={20} />
					)}
				</FormAlert.Icon>
				<div className="flex flex-col gap-1 whitespace-break-spaces">
					<FormAlert.Title>{title}</FormAlert.Title>
					<FormAlert.Description>{description}</FormAlert.Description>
				</div>
			</div>
		</FormAlert.Root>
	);
};
