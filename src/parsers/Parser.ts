'use strict';
import { readFile } from 'node:fs/promises';

export class Entry {
	amount: number;
	timestamp: number;
	date: string;
	description: string;

	constructor(amount: number, timestamp: number, date: string, description: string) {
		this.amount = amount;
		this.timestamp = timestamp;
		this.date = date;
		this.description = description;
	}
}

export interface Parser {
	/* Public Instance Methods */
	parse(data: string): Array<Entry>;
}

export async function parseFile(parser: Parser, filename: string): Promise<Array<Entry>> {
	const data = await readFile(filename, 'utf-8');
	return parser.parse(data);
}
