export class ProviderFailure extends Error {
  constructor(
    message: string,
    public delay = 300000
  ) {
    super(message);
  }
}
