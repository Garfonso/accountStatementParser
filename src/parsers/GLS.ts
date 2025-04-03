import { Parser } from './Parser';
import { Entry } from './Entry';
import {Logger, LogLevel} from 'sitka';

const parameters = {
    v2015: {
        detectRegex: /GLS.+(\d\d)\.(\d\d)\.(\d\d)\s(\d\d):(\d\d)\s+\d\s+\d/,
        startRegex: /BU-TAG\s+VORGANG/,
        entryRegEx: /^(\d\d)\.(\d\d)\.\s+(.+?)\s*([\d.]+),(\d\d)([+-])\s*\r?$/gm,
        endPageSkipStart: /Herrn|Frau|ZWISCHENSALDO.*|SALDO NEU.*|G\s*E\s*B\s*Ü\s*H\s*R\s*E\s*N\s*A\s*B\s*R\s*E\s*C\s*H\s*N\s*U\s*N\s*G|R\s*E\s*C\s*H\s*N\s*U\s*N\s*G\s*S\s*A\s*B\s*S\s*C\s*H\s*L\s*U\s*S\s*S.*|.*Sollzinskonditionen|\s*K\s*O\s*N\s*D\s*I\s*T.*/i,
        ibanRegEx: /.*Gläubiger-ID\s*:\s*([A-Za-z0-9]+)/,
        mandatsRefRegEx: /.*Mandats-?[Rr]ef.*\s*:\s*([A-Za-z0-9]+)/,
        ibanAndBicRegEx: /.*BIC:\s*([A-Za-z0-9]+).*IBAN:\s*([A-Za-z0-9]+)\s*/
    }
}

export default class GLS implements Parser {
    private _logger: Logger;
    owner: string;
    name: string;

    constructor(owner: string, name: string, logLevel: LogLevel = LogLevel.DEBUG) {
        this._logger = Logger.getLogger({name: 'GLSParser', level: logLevel});
        this.owner = owner;
        this.name = name;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    parse(_data: Array<string>): Array<Entry> {
        //not supported right now. Entries can continue over line breaks... AHRG.
        return [];
    }

    parseRawText(text: string): Array<Entry> {
        text = text.replace(/\r/g, '');
        this._logger.debug('Parsing GLS', text);
        const entries: Array<Entry> = [];
        let versionParameters: null | Record<string, RegExp> = null;
        let year = 0;
        let month = 0;
        let currentEntry = null;
        let skipping = true;
        for (const line of text.split('\n')) {
            this._logger.debug('got: ' + line);
            if (!versionParameters) {
                if (parameters.v2015.detectRegex.test(line)) {
                    this._logger.debug('Found start, version 2015.');
                    versionParameters = parameters.v2015;
                    const parts = parameters.v2015.detectRegex.exec(line);
                    if (parts) {
                        month = parseInt(parts[2], 10);
                        year = parseInt(parts[3], 10) + 2000;
                    }
                    this._logger.debug('Got year: ' + year);
                }
            } else {
                if (skipping) {
                    if (versionParameters?.startRegex.test(line)) {
                        skipping = false;
                        this._logger.debug('Found start of entries.');
                    }
                } else {
                    const parts = versionParameters?.entryRegEx.exec(line);
                    if (parts) {
                        if (currentEntry) {
                            entries.push(currentEntry);
                            //umbuchung is a special case, where the correspondent is the owner.
                            if (currentEntry.description.includes('Umbuchung')) {
                                currentEntry.umbuchung = true;
                                currentEntry.correspondent = this.owner;
                            }
                            this._logger.debug('Completed entry: ', currentEntry);
                        }
                        currentEntry = new Entry({owner: this.owner, account: this.name});
                        const currentMonth = parseInt(parts[2], 10);
                        let currentYear = year;
                        if (currentMonth > month) {
                            //if the month is bigger than the one we got from the header, then it is from the previous year.
                            currentYear = year - 1;
                        }
                        currentEntry.date = parts[1] + '.' + parts[2] + '.' + currentYear;
                        currentEntry.correspondent = this.name; //only valid for "zinsen" or Kontoführung usw. Will try to get the correct correspondent later.
                        currentEntry.description = parts[3];
                        if (currentEntry.description.toLowerCase().match(/sepa.*lastschrift/)) {
                            currentEntry.lastSchrift = true;
                            currentEntry.description = '';
                        } else if (currentEntry.description.toLowerCase().match(/.*überweisung.*/)) {
                            //first line just says it is an überweisung. The second line is the correspondent.
                            currentEntry.lastSchrift = false;
                            currentEntry.description = '';
                        }
                        currentEntry.amount = parseFloat(parts[6] + parts[4].replace(/\./g, '') + '.' + parts[5]);
                    } else if (versionParameters.endPageSkipStart.test(line)) {
                        this._logger.debug('Found end of entries, start over.');
                        skipping = true;
                    } else {
                        //probably is part of desciption. Add there.
                        if (currentEntry) {
                            if (currentEntry.lastSchrift) {
                                if (currentEntry.correspondent === this.name) {
                                    currentEntry.correspondent = line; //if lastschrift, then second line is correspondent.
                                } else {
                                    const ibanParts = versionParameters.ibanRegEx.exec(line);
                                    const mandatsRefParts = versionParameters.mandatsRefRegEx.exec(line);
                                    if (ibanParts) {
                                        currentEntry.IBAN = ibanParts[1];
                                    } else if (mandatsRefParts) {
                                        currentEntry.mandatsRef = mandatsRefParts[1];
                                    } else {
                                        currentEntry.description += (currentEntry.description ? '\n' : '') + line;
                                    }
                                }
                            } else {
                                const ibanAndBicParts = versionParameters.ibanAndBicRegEx.exec(line);
                                if (ibanAndBicParts) {
                                    currentEntry.IBAN = ibanAndBicParts[2];
                                    currentEntry.BIC = ibanAndBicParts[1];
                                } else {
                                    if (!currentEntry.description && currentEntry.correspondent === this.name) {
                                        currentEntry.correspondent = line;
                                    } else {
                                        currentEntry.description += (currentEntry.description ? '\n' : '') + line;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        if (currentEntry) {
            entries.push(currentEntry);
            //umbuchung is a special case, where the correspondent is the owner.
            if (currentEntry.description.includes('Umbuchung')) {
                currentEntry.umbuchung = true;
                currentEntry.correspondent = this.owner;
            }
            this._logger.debug('Completed entry: ', currentEntry);
        }
        return entries;
    }
}
