import { Parser, Entry } from '../Parser';

class GLS implements Parser {
    parse(data: string): Array<Entry> {
        const entries: Array<Entry> = [];
        const lines = data.split('\n');
        for (const line of lines) {
            const parts = line.split(';');
            if (parts.length < 4) {
                continue;
            }
            const amount = parseFloat(parts[3].replace(',', '.'));
            const timestamp = Date.parse(parts[0]);
            const date = parts[0];
            const description = parts[1];
            entries.push(new Entry(amount, timestamp, date, description));
        }
        return entries;
    }
}