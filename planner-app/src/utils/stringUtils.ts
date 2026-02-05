/**
 * String Utility Functions
 *
 * Helper functions for string manipulation and formatting.
 */

// =============================================================================
// String Formatting
// =============================================================================

/**
 * Capitalize the first letter of each word in a string
 * @param str - The input string to capitalize
 * @returns A new string with the first letter of each word capitalized
 *
 * @example
 * capitalizeWords('hello world') // "Hello World"
 * capitalizeWords('the quick brown fox') // "The Quick Brown Fox"
 * capitalizeWords('HELLO WORLD') // "HELLO WORLD" → "Hello World"
 * capitalizeWords('  multiple   spaces  ') // "  Multiple   Spaces  " (preserves spacing)
 * capitalizeWords('hello-world') // "Hello-world" (hyphens treated as word characters)
 * capitalizeWords('') // ""
 */
export function capitalizeWords(str: string): string {
  // Handle empty string edge case
  if (str.length === 0) {
    return str;
  }

  // Split on whitespace while preserving the whitespace pattern
  return str
    .split(/(\s+)/)
    .map((segment) => {
      // If segment is whitespace, return as-is
      if (/^\s+$/.test(segment)) {
        return segment;
      }

      // If segment is a word, capitalize first letter and lowercase the rest
      return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
    })
    .join('');
}
