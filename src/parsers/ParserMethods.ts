'use strict';
import {readdir, stat} from 'node:fs/promises';
import path from 'node:path';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFParser = require('pdf2json');
import { Page} from 'pdf2json';
import {Parser} from './Parser';
import {Entry} from './Entry';
import {Logger} from 'sitka';

export async function readDirecotry(parser: Parser, directory: string, logger: Logger): Promise<Array<Entry>> {
    const entries: Array<Entry> = [];
    const files = await readdir(directory);
    files.sort();
    for (const file of files) {
        const filename = path.join(directory, file);
        const fileStats = await stat(filename);
        if (fileStats.isDirectory()) {
            const fileEntries = await readDirecotry(parser, filename, logger);
            entries.push(...fileEntries);
            continue;
        }
        if (!file.toLowerCase().endsWith('.pdf')) {
            logger.debug('Skipping non-pdf file: ' + file);
            continue;
        }
        logger.debug('Parsing file: ' + file + ' with ' + parser.name);
        if (file.startsWith('2016-07-05')) {
            const fileEntries = await parseFile(parser, filename, logger);
            entries.push(...fileEntries);
            process.exit(0);
        }
    }
    logger.debug('Found ' + entries.length + ' entries');
    return entries;
}

export function parsePage(parser: Parser, page: Page): Array<Entry> {
    const texts: string[] = [];
    for (const text of page.Texts) {
        for (const textRuns of text.R) {
            texts.push(textRuns.T);
        }
    }
    return parser.parse(texts);
}

export async function parseFile(parser: Parser, filename: string, logger: Logger): Promise<Array<Entry>> {
    //parse pdf to json:
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1);
        const results : Entry[] = [];
        pdfParser.on('pdfParser_dataError', (errData:Record<'parserError', Error>) => {
            logger.error('Error parsing PDF: ' + errData);
            reject(errData);
        });
        pdfParser.on('data', (page: Page|null) => {
            if (page) {
                const pageResults = parsePage(parser, page);
                logger.debug('Found ' + pageResults.length + ' entries on page');
                results.push(...pageResults);
            } else {
                //done if page === null.
                resolve(results);
            }
        });
        pdfParser.on('pdfParser_dataReady', () => {
            const textResults = parser.parseRawText(pdfParser.getRawTextContent());
            logger.debug('Found ' + textResults.length + ' entries on page');
            results.push(...textResults);

        });

        pdfParser.loadPDF(filename);
    });
}
