/**
 * Input validators and content sanitizers for ChathuX
 */

const INVITE_REGEX = /(discord\.(gg|io|me|li)|discordapp\.com\/invite|discord\.com\/invite)\/[a-zA-Z0-9]+/i;
const URL_REGEX = /(https?:\/\/[^\s]+)/gi;
const MENTION_REGEX = /<@!?(\d+)>|<@&(\d+)>/g;

const DEFAULT_BAD_WORDS = [
    'nigger', 'faggot', 'retard', 'kike', 'chink', 'spic', 'cunt'
];

/**
 * Checks if a string contains a Discord invite link
 */
function containsInvite(text) {
    return INVITE_REGEX.test(text);
}

/**
 * Checks if a string contains any URL
 */
function containsUrl(text) {
    return URL_REGEX.test(text);
}

/**
 * Counts user/role mentions in a message
 */
function countMentions(text) {
    const matches = text.match(MENTION_REGEX);
    return matches ? matches.length : 0;
}

/**
 * Checks if text contains profanity / banned terms
 */
function containsBadWords(text, customList = []) {
    const words = [...DEFAULT_BAD_WORDS, ...customList];
    const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    
    return words.some(badWord => {
        const regex = new RegExp(`\\b${badWord}\\b`, 'i');
        return regex.test(normalized);
    });
}

/**
 * Sanitizes markdown characters from user strings
 */
function sanitizeText(text, maxLength = 1000) {
    if (!text) return '';
    return text.trim().slice(0, maxLength);
}

module.exports = {
    containsInvite,
    containsUrl,
    countMentions,
    containsBadWords,
    sanitizeText
};
