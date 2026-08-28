import { normalizeNativeIntentPath } from '@/lib/native-linking';

export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}) {
  return normalizeNativeIntentPath(path);
}
