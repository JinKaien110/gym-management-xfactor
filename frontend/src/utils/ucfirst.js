/**
 * Converts a string to title case (capitalizes first letter of each word)
 * @param {string} str - The string to convert
 * @returns {string} The converted string in title case
 */
export default function ucfirst(str) {
  if (!str) return '';

  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
