import type { MnemonicWordCount } from './types';

interface ApplyMnemonicPasteParams {
  currentWords: string[];
  currentWordCount: MnemonicWordCount;
  pastedText: string;
  startIndex?: number;
}

const normalizeWords = (raw: string): string[] =>
  raw
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());

const resolveWordCount = (
  currentWordCount: MnemonicWordCount,
  pastedWordLength: number
): MnemonicWordCount => {
  if (currentWordCount === 24 || pastedWordLength > 12) {
    return 24;
  }
  return 12;
};

export const resizeMnemonicWords = (
  currentWords: string[],
  count: MnemonicWordCount
): string[] => {
  const resized = Array<string>(count).fill('');

  for (let index = 0; index < count; index += 1) {
    resized[index] = currentWords[index] ?? '';
  }

  return resized;
};

export const joinMnemonicWords = (words: string[]): string =>
  words.filter((word) => word.trim() !== '').join(' ');

export const applyMnemonicPaste = ({
  currentWords,
  currentWordCount,
  pastedText,
  startIndex = 0,
}: ApplyMnemonicPasteParams): { words: string[]; wordCount: MnemonicWordCount } => {
  const pastedWords = normalizeWords(pastedText);
  const wordCount = resolveWordCount(currentWordCount, pastedWords.length);
  const nextWords = resizeMnemonicWords(currentWords, wordCount);

  pastedWords.forEach((word, offset) => {
    const targetIndex = startIndex + offset;
    if (targetIndex < wordCount) {
      nextWords[targetIndex] = word;
    }
  });

  return { words: nextWords, wordCount };
};
