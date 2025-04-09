export function GenerateSerialNumber(materielType: string):string{
    const prefix = materielType.substring(0, 3).toUpperCase(); // Get first 3 letters of the materiel type and convert to uppercase
    
    const timestamp = Date.now(); // Get the current timestamp
    const truncatedTimestamp = Math.floor(timestamp / 60000); // Truncate the timestamp to the first digit to the minute
    const randomNum = truncatedTimestamp % 1000000; // Ensure it's a 6-digit number
    
    const paddedNum = String(randomNum).padStart(6, '0'); // Pad the number with leading zeros to ensure it's 6 digits
    return `${prefix}-${paddedNum}`; // Return the formatted serial number
}