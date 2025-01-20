import React from 'react';
import { cva, VariantProps } from 'cva';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '../utils';

export const tabsListStyle = cva({
	base: '',
	variants: {
		variant: {
			primary:
				'inline-flex h-9 items-center justify-center rounded-lg bg-slate-4 p-1 text-text-menu',
			default: ''
		}
	},
	defaultVariants: {
		variant: 'default'
	}
});

export const tabsTriggerStyle = cva({
	base: '',
	variants: {
		variant: {
			default: '',
			primary: [
				'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all',
				'disabled:pointer-events-none disabled:opacity-50',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ',
				'data-[state=active]:bg-white data-[state=active]:text-text-primary data-[state=active]:shadow',
				// For toggle group
				'data-[state=on]:bg-white data-[state=on]:text-text-primary data-[state=on]:shadow'
			],
			'settings-tab': [
				'flex items-center gap-2 whitespace-nowrap rounded-md p-2 text-sm font-medium ring-offset-background transition-all',
				'hover:bg-slate-4',
				'data-[state=active]:bg-indigo-4 data-[state=active]:text-text-primary data-[state=active]:font-semibold',
				'disabled:pointer-events-none disabled:opacity-50'
			]
		}
	},
	defaultVariants: {
		variant: 'default'
	}
});

export const tabsContentStyle = cva({
	base: '',
	variants: {
		variant: {
			default: '',
			primary:
				'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
		}
	},
	defaultVariants: {
		variant: 'default'
	}
});

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.List>,
	React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> &
		VariantProps<typeof tabsListStyle>
>(({ className, variant, ...props }, ref) => (
	<TabsPrimitive.List
		ref={ref}
		className={cn(tabsListStyle({ variant }), className)}
		{...props}
	/>
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> &
		VariantProps<typeof tabsTriggerStyle>
>(({ className, variant, ...props }, ref) => (
	<TabsPrimitive.Trigger
		ref={ref}
		className={cn(tabsTriggerStyle({ variant }), className)}
		{...props}
	/>
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> &
		VariantProps<typeof tabsContentStyle>
>(({ className, variant, ...props }, ref) => (
	<TabsPrimitive.Content
		ref={ref}
		className={cn(tabsContentStyle({ variant }), className)}
		{...props}
	/>
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
