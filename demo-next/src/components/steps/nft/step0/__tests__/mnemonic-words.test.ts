import { describe, expect, it } from 'vitest';
import {
  applyMnemonicPaste,
  joinMnemonicWords,
  resizeMnemonicWords,
} from '../mnemonic-words';

describe('mnemonic-words helpers', () => {
  it('keeps existing words when pasting from a middle index', () => {
    const baseWords = resizeMnemonicWords(['alpha', 'beta'], 12);

    const { words, wordCount } = applyMnemonicPaste({
      currentWords: baseWords,
      currentWordCount: 12,
      pastedText: 'gamma delta',
      startIndex: 2,
    });

    expect(wordCount).toBe(12);
    expect(words[0]).toBe('alpha');
    expect(words[1]).toBe('beta');
    expect(words[2]).toBe('gamma');
    expect(words[3]).toBe('delta');
  });

  it('expands to 24 words when a 24-word mnemonic is pasted', () => {
    const words24 = Array.from({ length: 24 }, (_, i) => `word${i + 1}`).join(' ');
    const { wordCount, words } = applyMnemonicPaste({
      currentWords: resizeMnemonicWords([], 12),
      currentWordCount: 12,
      pastedText: words24,
    });

    expect(wordCount).toBe(24);
    expect(words).toHaveLength(24);
    expect(words[0]).toBe('word1');
    expect(words[23]).toBe('word24');
  });

  it('does not downgrade from 24 to 12 on partial paste', () => {
    const initial = resizeMnemonicWords(['seed1', 'seed2'], 24);
    const { wordCount, words } = applyMnemonicPaste({
      currentWords: initial,
      currentWordCount: 24,
      pastedText: 'extra words',
      startIndex: 2,
    });

    expect(wordCount).toBe(24);
    expect(words).toHaveLength(24);
  });

  it('joins non-empty words only', () => {
    expect(joinMnemonicWords(['one', '', 'two', '   ', 'three'])).toBe(
      'one two three'
    );
  });
});
