export class Entry {
    amount = 0;
    timestamp: number;
    correspondent = '';
    description = '';
    IBAN = '';
    BIC = '';
    private _date: string;
    owner = '';
    account = '';
    file = '';
    hash = ''; //used to identify the entry. Should be based on all information used to create the entry.
    lastSchrift = false;
    umbuchung = false;
    mandatsRef = '';


    constructor({ amount = 0, date = '', correspondent = '', description = '', IBAN = '', BIC = '', owner = '', account = '' }:
                { amount?: number, date?: string, correspondent?: string, description?: string, IBAN?: string, BIC?: string, owner?: string, account?: string; } = {}) {
        Object.assign(this, { amount, correspondent, description, IBAN, BIC, owner, account });
        this._date = date;
        this.timestamp = this._date ? new Date(date).getTime() : 0;
    }

    set date(date: string) {
        this._date = date;
        if (!this.timestamp) {
            const parts = date.split('.');
            this.timestamp = new Date(Number(parts[2]), Number(parts[1]), Number(parts[0])).getTime();
        }
    }
    get date() {
        return this._date;
    }
}
