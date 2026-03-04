export const ENABLE_STEP10_PRIVATE_KEY_SIGNER =
  process.env.NEXT_PUBLIC_ENABLE_STEP10_PRIVATE_KEY_SIGNER === 'true';

export function maskSensitiveHex(
  value: string,
  startChars = 10,
  endChars = 8
): string {
  if (!value) return value;
  if (value.length <= startChars + endChars) return value;
  return `${value.slice(0, startChars)}...${value.slice(-endChars)}`;
}
