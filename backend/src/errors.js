export class RewardError extends Error {
  constructor(code, message, options) {
    super(message, options);
    this.name = 'RewardError';
    this.code = code;
  }
}

export function fail(code, message) {
  throw new RewardError(code, message);
}
