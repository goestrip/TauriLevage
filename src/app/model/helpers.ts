export function GenerateSerialNumber(materielType: string):string{
    const prefix = materielType.substring(0, 3).toUpperCase(); // Get first 3 letters of the materiel type and convert to uppercase
    
    const timestamp = Date.now(); // Get the current timestamp
    const truncatedTimestamp = Math.floor(timestamp / 60000); // Truncate the timestamp to the first digit to the minute
    const randomNum = truncatedTimestamp % 1000000; // Ensure it's a 6-digit number
    
    const paddedNum = String(randomNum).padStart(6, '0'); // Pad the number with leading zeros to ensure it's 6 digits
    return `${prefix}-${paddedNum}`; // Return the formatted serial number
}

    
export const YEAR_TO_MS = 365 * 24 *3600 * 1000;

export function dateToMs(value: Date | null | undefined): number | null {
    if (!value) {
        return null;
    }
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? null : time;
}

export function msToDate(value: number | null | undefined): Date | null {
    if (!value) {
        return null;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function toOptionalNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    const numberValue = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
}

export function toOptionalInt(value: unknown): number | null {
    const numberValue = toOptionalNumber(value);
    return numberValue == null ? null : Math.trunc(numberValue);
}

export function formDate(value: unknown): Date | null {
    if (value == null || value === '') {
        return null;
    }
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
}

export function errorText(error: unknown): string {
    if (typeof error === 'string') {
        return error;
    }
    if (error instanceof Error) {
        return error.message;
    }
    try {
        return JSON.stringify(error);
    } catch {
        return String(error);
    }
}