import { Criticity, parseCriticity } from "./criticity";
import { People } from "./people";

export interface ParsedCsv {
    headers: string[] | null;
    rows: string[][];
}

export interface ImportResult {
    imported: number;
    skipped: number;
    errors: string[];
}

export function parseCsv(content: string): ParsedCsv {
    const withoutHint = content
        .replace(/^\uFEFF/, '')
        .replace(/^sep=.\r?\n/i, '');
    const table = parseCsvTable(withoutHint, detectDelimiter(withoutHint));
    const meaningful = table.filter((row) => row.some((cell) => cell.trim().length > 0));
    if (meaningful.length === 0) {
        return { headers: null, rows: [] };
    }
    const first = meaningful[0].map((cell) => cell.trim().toLowerCase());
    if (first.includes('serial') || first.includes('numéro de série') || first.includes('numero de serie')) {
        return {
            headers: first.map((cell) => cell === 'numéro de série' || cell === 'numero de serie' ? 'serial' : cell),
            rows: meaningful.slice(1),
        };
    }
    return { headers: null, rows: meaningful };
}

export function cell(row: string[], headers: string[] | null, name: string, index: number): string {
    if (headers) {
        const aliases = [name, ...headerAliases(name)];
        for (const alias of aliases) {
            const position = headers.indexOf(alias);
            if (position >= 0) {
                return (row[position] ?? '').trim();
            }
        }
        return '';
    }
    return (row[index] ?? '').trim();
}

export function parseFlexibleDate(value: string | null | undefined): Date | null {
    if (!value) {
        return null;
    }
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
        const serial = Number(trimmed);
        if (serial > 20000 && serial < 80000) {
            const utc = new Date(Date.UTC(1899, 11, 30) + Math.floor(serial) * 86400000);
            return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
        }
    }
    const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
    if (iso) {
        return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    }
    const local = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/.exec(trimmed);
    if (local) {
        return new Date(Number(local[3]), Number(local[2]) - 1, Number(local[1]));
    }
    const parsed = Date.parse(trimmed);
    return Number.isNaN(parsed) ? null : new Date(parsed);
}

export function formatCsvDate(value: Date | null | undefined): string {
    if (!value) {
        return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

export function csvEscape(value: string | number | null | undefined): string {
    const text = value == null ? '' : String(value);
    if (/[",\n\r;]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

export function toCsvDocument(headers: string[], rows: Array<Array<string | number | null | undefined>>): string {
    const lines = [
        headers.map((header) => csvEscape(header)).join(','),
        ...rows.map((row) => row.map((value) => csvEscape(value)).join(',')),
    ];
    return `\uFEFFsep=,\n${lines.join('\n')}\n`;
}

export function downloadCsv(filename: string, content: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

export function splitPersonName(value: string): { prenom: string; nom: string } | null {
    const parts = value.trim().split(/\s+/).filter((part) => part.length > 0);
    if (parts.length === 0) {
        return null;
    }
    if (parts.length === 1) {
        return { prenom: '', nom: parts[0] };
    }
    return { prenom: parts.slice(0, -1).join(' '), nom: parts[parts.length - 1] };
}

export function personLabel(person: People | null | undefined): string {
    if (!person) {
        return '';
    }
    return `${person.prenom} ${person.nom}`.trim();
}

export function sameName(left: string, right: string): boolean {
    return left.trim().toLocaleLowerCase('fr') === right.trim().toLocaleLowerCase('fr');
}

export function criticityFromCsv(value: string, resolution: Date | null): Criticity {
    if (resolution) {
        return Criticity.PROCESSED;
    }
    return parseCriticity(value);
}

function headerAliases(name: string): string[] {
    switch (name) {
        case 'date_mise_en_service':
            return ['mise en service'];
        case 'date_fabrication':
            return ['fabrication', 'date de fabrication'];
        case 'validite_years':
            return ['durée validité', 'duree validite', 'validite'];
        case 'assigned_to':
            return ['assignation', 'personne'];
        case 'secteur':
            return ['emplacement', 'location'];
        case 'date_last_control':
            return ['date controle', 'date contrôle', 'controle', 'contrôle'];
        case 'date_rebus':
            return ['date rebus', 'date rebut', 'rebus'];
        case 'anomaly_name':
            return ['anomalie', 'anomalie type', 'type anomalie'];
        case 'anomaly_criticity':
            return ['criticité', 'criticite'];
        case 'date_resolution':
            return ['date de résolution', 'date de resolution', 'résolution', 'resolution'];
        case 'cmu_kg':
            return ['cmu', 'cmu (kg)'];
        case 'longueur_m':
            return ['longueur', 'longueur (m)'];
        case 'essai_charge_kg':
            return ['essai charge', 'essai charge (kg)', 'essai_charge'];
        case 'anomaly_description':
            return ['description', 'description anomalie'];
        case 'date_detection':
            return ['date de détection', 'date de detection', 'détection', 'detection'];
        default:
            return [];
    }
}

function detectDelimiter(content: string): ',' | ';' {
    const header = content.split(/\r?\n/, 1)[0] ?? '';
    const commas = (header.match(/,/g) ?? []).length;
    const semicolons = (header.match(/;/g) ?? []).length;
    return semicolons > commas ? ';' : ',';
}

function parseCsvTable(content: string, delimiter: ',' | ';'): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let cellValue = '';
    let inQuotes = false;

    for (let index = 0; index < content.length; index++) {
        const character = content[index];
        if (inQuotes) {
            if (character === '"') {
                if (content[index + 1] === '"') {
                    cellValue += '"';
                    index++;
                } else {
                    inQuotes = false;
                }
            } else {
                cellValue += character;
            }
            continue;
        }
        if (character === '"') {
            inQuotes = true;
        } else if (character === delimiter) {
            row.push(cellValue.trim());
            cellValue = '';
        } else if (character === '\n') {
            row.push(cellValue.trim());
            rows.push(row);
            row = [];
            cellValue = '';
        } else if (character !== '\r') {
            cellValue += character;
        }
    }

    if (cellValue.length > 0 || row.length > 0) {
        row.push(cellValue.trim());
        rows.push(row);
    }
    return rows;
}
