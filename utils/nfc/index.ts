export function hexEncodedString(input: string) {
    return Buffer.from(input).toString('hex')
}