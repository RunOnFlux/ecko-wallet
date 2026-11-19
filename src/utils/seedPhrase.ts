/**
 * Splits pasted or typed text into Secret Recovery Phrase words.
 *
 * The wordlist is lowercase a–z only, so anything else (spaces, tabs, line breaks, list numbering like "1." or
 * "1)", commas, quotes) only separates words and can be dropped, and capitals can be lowered. A phrase the wallet
 * accepted before is already in that clean form, so this never changes which keys an existing phrase derives.
 */
export const splitSeedPhrase = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/[^a-z]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);

/** The phrase as the key derivation expects it: lowercase words separated by single spaces. */
export const normalizeSeedPhrase = (text: string): string => splitSeedPhrase(text).join(' ');
