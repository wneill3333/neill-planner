/**
 * String Utility Functions Tests
 *
 * Comprehensive tests for string manipulation and formatting utilities.
 */

import { describe, it, expect } from 'vitest';
import { capitalizeWords } from '../stringUtils';

// =============================================================================
// Test Setup
// =============================================================================

describe('stringUtils', () => {
  // =============================================================================
  // capitalizeWords Tests
  // =============================================================================

  describe('capitalizeWords', () => {
    it('should capitalize the first letter of each word', () => {
      expect(capitalizeWords('hello world')).toBe('Hello World');
      expect(capitalizeWords('the quick brown fox')).toBe('The Quick Brown Fox');
      expect(capitalizeWords('lorem ipsum dolor sit amet')).toBe(
        'Lorem Ipsum Dolor Sit Amet'
      );
    });

    it('should handle single word strings', () => {
      expect(capitalizeWords('hello')).toBe('Hello');
      expect(capitalizeWords('world')).toBe('World');
      expect(capitalizeWords('a')).toBe('A');
    });

    it('should handle already capitalized words', () => {
      expect(capitalizeWords('Hello World')).toBe('Hello World');
      expect(capitalizeWords('The Quick Brown Fox')).toBe('The Quick Brown Fox');
    });

    it('should handle all uppercase strings', () => {
      expect(capitalizeWords('HELLO WORLD')).toBe('Hello World');
      expect(capitalizeWords('THE QUICK BROWN FOX')).toBe('The Quick Brown Fox');
    });

    it('should handle mixed case strings', () => {
      expect(capitalizeWords('hElLo WoRlD')).toBe('Hello World');
      expect(capitalizeWords('tHe QuIcK bRoWn FoX')).toBe('The Quick Brown Fox');
    });

    it('should handle empty string', () => {
      expect(capitalizeWords('')).toBe('');
    });

    it('should handle strings with only whitespace', () => {
      expect(capitalizeWords('   ')).toBe('   ');
      expect(capitalizeWords('\t\t')).toBe('\t\t');
      expect(capitalizeWords('\n\n')).toBe('\n\n');
    });

    it('should preserve multiple spaces between words', () => {
      expect(capitalizeWords('hello  world')).toBe('Hello  World');
      expect(capitalizeWords('the   quick   brown')).toBe('The   Quick   Brown');
      expect(capitalizeWords('multiple     spaces')).toBe('Multiple     Spaces');
    });

    it('should preserve leading and trailing spaces', () => {
      expect(capitalizeWords('  hello world')).toBe('  Hello World');
      expect(capitalizeWords('hello world  ')).toBe('Hello World  ');
      expect(capitalizeWords('  hello world  ')).toBe('  Hello World  ');
    });

    it('should handle tabs as whitespace', () => {
      expect(capitalizeWords('hello\tworld')).toBe('Hello\tWorld');
      expect(capitalizeWords('\thello\tworld\t')).toBe('\tHello\tWorld\t');
    });

    it('should handle newlines as whitespace', () => {
      expect(capitalizeWords('hello\nworld')).toBe('Hello\nWorld');
      expect(capitalizeWords('the\nquick\nbrown')).toBe('The\nQuick\nBrown');
    });

    it('should handle mixed whitespace characters', () => {
      expect(capitalizeWords('hello \t world \n fox')).toBe(
        'Hello \t World \n Fox'
      );
    });

    it('should handle strings with numbers', () => {
      expect(capitalizeWords('hello 123 world')).toBe('Hello 123 World');
      expect(capitalizeWords('test123 abc456')).toBe('Test123 Abc456');
    });

    it('should handle strings with special characters', () => {
      expect(capitalizeWords('hello-world')).toBe('Hello-world');
      expect(capitalizeWords("it's a beautiful day")).toBe("It's A Beautiful Day");
      expect(capitalizeWords('hello_world')).toBe('Hello_world');
    });

    it('should handle strings with punctuation', () => {
      expect(capitalizeWords('hello, world!')).toBe('Hello, World!');
      expect(capitalizeWords('the quick? brown fox.')).toBe(
        'The Quick? Brown Fox.'
      );
    });

    it('should handle single character words', () => {
      expect(capitalizeWords('a b c d')).toBe('A B C D');
      expect(capitalizeWords('i am a developer')).toBe('I Am A Developer');
    });

    it('should handle very long strings', () => {
      const longString = 'the quick brown fox jumps over the lazy dog';
      expect(capitalizeWords(longString)).toBe(
        'The Quick Brown Fox Jumps Over The Lazy Dog'
      );
    });

    it('should handle unicode characters', () => {
      expect(capitalizeWords('café résumé')).toBe('Café Résumé');
      expect(capitalizeWords('über schön')).toBe('Über Schön');
    });

    it('should be idempotent', () => {
      const input = 'hello world';
      const firstPass = capitalizeWords(input);
      const secondPass = capitalizeWords(firstPass);
      expect(firstPass).toBe(secondPass);
      expect(firstPass).toBe('Hello World');
    });

    it('should handle realistic use cases', () => {
      // Task titles
      expect(capitalizeWords('review pull request')).toBe('Review Pull Request');
      expect(capitalizeWords('update documentation')).toBe('Update Documentation');

      // Names
      expect(capitalizeWords('john doe')).toBe('John Doe');
      expect(capitalizeWords('mary jane watson')).toBe('Mary Jane Watson');

      // Phrases
      expect(capitalizeWords('to do or not to do')).toBe('To Do Or Not To Do');
      expect(capitalizeWords('the art of war')).toBe('The Art Of War');
    });

    it('should handle edge case: string starting with number', () => {
      expect(capitalizeWords('123 hello world')).toBe('123 Hello World');
      expect(capitalizeWords('9am meeting')).toBe('9am Meeting');
    });

    it('should handle edge case: consecutive whitespace types', () => {
      expect(capitalizeWords('hello \t\n world')).toBe('Hello \t\n World');
    });

    it('should not modify non-alphabetic characters at start of word', () => {
      expect(capitalizeWords('123abc 456def')).toBe('123abc 456def');
    });

    it('should handle empty segments correctly', () => {
      // Multiple spaces create empty segments when split
      expect(capitalizeWords('a  b')).toBe('A  B');
      expect(capitalizeWords('   a   b   ')).toBe('   A   B   ');
    });
  });
});
