/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useState } from 'react';
import { GaugeIcon, SparklesIcon } from 'lucide-react';

import type { ChatProvider } from '@/services/bublik-api';
import {
	ButtonTw,
	Popover,
	PopoverTrigger,
	PopoverContent,
	Command,
	CommandInput,
	CommandList,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Icon
} from '@/shared/tailwind-ui';

/**
 * Model picker for the prompt input toolbar. `value` uses the feature's
 * existing `provider|||model` encoding so the caller keeps its selection state
 * untouched; models are grouped per provider and can be searched by name.
 */
export function ModelSelect({
	providers,
	value,
	onValueChange,
	encode
}: {
	providers: ChatProvider[];
	value: string;
	onValueChange: (value: string) => void;
	encode: (provider: string, model: string) => string;
}) {
	const [open, setOpen] = useState(false);

	// Resolve display name of the currently selected model.
	let triggerLabel = 'Model';
	outer: for (const p of providers) {
		for (const m of p.models) {
			if (encode(p.id, m.name) === value) {
				triggerLabel = `${p.display_name} / ${m.display_name}`;
				break outer;
			}
		}
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<ButtonTw
					size="xs"
					variant="outline-secondary"
					state={open ? 'active' : 'default'}
				>
					<SparklesIcon className="size-3.5 mr-1.5" />
					{triggerLabel}
					<Icon name="ArrowShortSmall" className="ml-1.5" />
				</ButtonTw>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				className="min-w-64 rounded-lg p-0 bg-white shadow-popover"
				sideOffset={4}
			>
				<Command>
					<CommandInput
						placeholder="Search models…"
						className="text-xs"
						startIcon={
							<Icon
								name="MagnifyingGlass"
								size={18}
								className="opacity-50 shrink-0 mr-2"
							/>
						}
					/>
					<CommandList className="max-h-96 overflow-y-auto">
						<CommandEmpty className="py-4 text-xs text-center">
							No models found.
						</CommandEmpty>
						{providers.map((p) => (
							<CommandGroup
								key={p.id}
								heading={p.display_name}
								className="border-t border-border-primary first:border-t-0 p-0 [&_[cmdk-group-heading]]:border-b [&_[cmdk-group-heading]]:border-border-primary [&_[cmdk-group-heading]]:h-9 [&_[cmdk-group-heading]]:flex [&_[cmdk-group-heading]]:items-center [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-[0.6875rem] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-text-secondary"
							>
								{p.models.length ? (
									p.models.map((m) => {
										const itemValue = encode(p.id, m.name);
										const isSelected = itemValue === value;

										return (
											<CommandItem
												key={`${p.id}:${m.name}`}
												value={itemValue}
												keywords={[p.display_name, m.name]}
												onSelect={() => {
													onValueChange(itemValue);
													setOpen(false);
												}}
											>
												<span className="mr-2 flex h-3.5 w-3.5 items-center justify-center">
													{isSelected && (
														<div className="h-2 w-2 rounded-full bg-primary" />
													)}
												</span>
												<span className="text-xs">{m.display_name}</span>
											</CommandItem>
										);
									})
								) : (
									<div className="text-xs text-center my-4 text-text-unexpected">
										No models found!
									</div>
								)}
							</CommandGroup>
						))}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

/** Reasoning-effort picker; render only for models that support efforts. */
export function EffortSelect({
	efforts,
	value,
	onValueChange
}: {
	efforts: string[];
	value: string;
	onValueChange: (value: string) => void;
}) {
	const [open, setOpen] = useState(false);

	const triggerLabel = value
		? value.charAt(0).toUpperCase() + value.slice(1)
		: 'Effort';

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<ButtonTw
					size="xs"
					variant="outline"
					state={open ? 'active' : 'default'}
				>
					<GaugeIcon className="size-3.5 mr-1.5" />
					{triggerLabel}
					<Icon name="ArrowShortSmall" className="ml-1.5" />
				</ButtonTw>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-44 rounded-lg">
				<DropdownMenuLabel className="text-xs">
					Reasoning Effort
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
					{efforts.map((effort) => (
						<DropdownMenuRadioItem
							key={effort}
							value={effort}
							className="text-xs"
						>
							{effort.charAt(0).toUpperCase() + effort.slice(1)}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
