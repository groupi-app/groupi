/** Correlation key, not an authorization secret. Preserve it and the body on retry. */
export function announcementRequestId() {
  return `${Date.now()}.xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(
    /[xy]/g,
    character => {
      const value = Math.floor(Math.random() * 16);
      return (character === 'x' ? value : (value & 3) | 8).toString(16);
    }
  );
}
