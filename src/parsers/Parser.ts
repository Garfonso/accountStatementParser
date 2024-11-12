'use strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import PDFParser from 'pdf2json';

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

export async function readDirecotry(parser: Parser, directory: string): Promise<Array<Entry>> {
    const entries: Array<Entry> = [];
    const files = await readdir(directory);
    for (const file of files) {
        const filename = path.join(directory, file);
        const fileStats = await stat(filename);
        if (fileStats.isDirectory()) {
            const fileEntries = await readDirecotry(parser, filename);
            entries.push(...fileEntries);
            continue;
        }
        const fileEntries = await parseFile(parser, filename);
        entries.push(...fileEntries);
    }
    return entries;
}

export async function parseFile(parser: Parser, filename: string): Promise<Array<Entry>> {
    const data = await readFile(filename);
    //parse pdf to json:
    PDFParser.
    return parser.parse(data);
}
