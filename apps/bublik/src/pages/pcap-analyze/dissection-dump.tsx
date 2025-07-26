import React, { useMemo, useEffect, useState, useCallback } from 'react';

interface DissectionDumpProps {
	buffer: Uint8Array;
	selected: [number, number];
	onSelect?: (offset: number) => void;
}

interface HighlightedTextProps {
	text: string;
	start: number;
	size: number;
	onOffsetClicked?: (offset: number) => void;
}

const HighlightedText: React.FC<HighlightedTextProps> = ({
	text,
	start,
	size,
	onOffsetClicked
}) => {
	// Render text with highlight from start for size chars
	// Each char is clickable, offset is index in text
	return (
		<span
			style={{
				whiteSpace: 'pre',
				wordBreak: 'break-all',
				fontFamily: 'inherit',
				fontSize: 'inherit'
			}}
		>
			{Array.from(text).map((char, i) => {
				const highlighted = i >= start && i < start + size;
				return (
					<span
						key={i}
						onClick={() => onOffsetClicked?.(i)}
						style={{
							background: highlighted ? '#fde68a' : undefined,
							cursor: 'pointer'
						}}
					>
						{char}
					</span>
				);
			})}
		</span>
	);
};

export const DissectionDump: React.FC<DissectionDumpProps> = ({
	buffer,
	selected,
	onSelect
}) => {
	// Compute address, hex, ascii lines
	const [asciiHighlight, setAsciiHighlight] = useState<[number, number]>([
		0, 0
	]);
	const [hexHighlight, setHexHighlight] = useState<[number, number]>([0, 0]);

	const { addrLines, hexLines, asciiLines } = useMemo(() => {
		const addr_lines: string[] = [];
		const hex_lines: string[] = [];
		const ascii_lines: string[] = [];
		for (let i = 0; i < buffer.length; i += 16) {
			const address = i.toString(16).padStart(8, '0');
			const block = buffer.slice(i, i + 16);
			const hexArray: string[] = [];
			const asciiArray: string[] = [];
			for (const value of block) {
				hexArray.push(value.toString(16).padStart(2, '0'));
				asciiArray.push(
					value >= 0x20 && value < 0x7f ? String.fromCharCode(value) : '.'
				);
			}
			const hexString =
				hexArray.length > 8
					? hexArray.slice(0, 8).join(' ') + '　' + hexArray.slice(8).join(' ')
					: hexArray.join(' ');
			addr_lines.push(address);
			hex_lines.push(hexString);
			ascii_lines.push(asciiArray.join(''));
		}
		return {
			addrLines: addr_lines,
			hexLines: hex_lines,
			asciiLines: ascii_lines
		};
	}, [buffer]);

	// Highlight calculation (watch selected)
	useEffect(() => {
		const [start, size] = selected;
		const hexSize = size * 2 + (size > 0 ? size - 1 : 0);
		const hexPos =
			start * 2 + (start > 0 ? start : 0) + (start > 0 ? start : 0);
		const asciiPos = start + Math.floor(start / 16);
		const asciiSize =
			size > 0 ? start + size + Math.floor((start + size) / 16) - asciiPos : 0;
		setAsciiHighlight([asciiPos, asciiSize]);
		setHexHighlight([hexPos, size > 0 ? hexSize : 0]);
	}, [selected]);

	// Offset click handlers
	const handleHexClick = useCallback(
		(offset: number) => {
			// Each hex byte is 2 chars, plus a space, so every 3 chars is a byte
			if (onSelect) onSelect(Math.floor(offset / 3));
		},
		[onSelect]
	);

	const handleAsciiClick = useCallback(
		(offset: number) => {
			// Each ascii char is 1 char, but there is a line break every 16 chars
			if (onSelect) onSelect(offset - Math.floor(offset / 17));
		},
		[onSelect]
	);

	return (
		<div className="flex font-mono text-xs whitespace-pre break-all">
			<div className="select-none text-gray-500" style={{ minWidth: 60 }}>
				{addrLines.join('\n')}
			</div>
			<div className="ml-4 cursor-pointer">
				<HighlightedText
					text={hexLines.join('\n')}
					start={hexHighlight[0]}
					size={hexHighlight[1]}
					onOffsetClicked={handleHexClick}
				/>
			</div>
			<div className="ml-4 cursor-pointer">
				<HighlightedText
					text={asciiLines.join('\n')}
					start={asciiHighlight[0]}
					size={asciiHighlight[1]}
					onOffsetClicked={handleAsciiClick}
				/>
			</div>
		</div>
	);
};

export default DissectionDump;
