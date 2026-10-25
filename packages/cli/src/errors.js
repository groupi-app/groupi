export class CliError extends Error {
  /** @param {string} code @param {string} message @param {number} exitCode */
  constructor(code, message, exitCode = 1) {
    super(message);
    this.code = code;
    this.exitCode = exitCode;
  }
}
