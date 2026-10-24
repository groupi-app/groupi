// Allow ordinary conversation/member permissions only; unknown future permissions fail closed.
export const MEMBER_PERMISSIONS = [
  0, 6, 10, 11, 12, 14, 15, 16, 17, 18, 20, 21, 25, 26, 31, 32, 35, 36, 38, 39,
  42, 46, 49, 50,
].reduce((bits, bit) => bits | (1n << BigInt(bit)), 0n);
