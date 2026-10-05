import { createRewardService, createSqliteRewardRepository } from '../src/index.js';
import { FIXED_TIME, testAuthorization } from './helpers.js';

const repository = createSqliteRewardRepository({ filename: process.argv[2], busyTimeoutMs: 3000 });
const service = createRewardService({ repository, issuerAuthorization: testAuthorization, clock: () => FIXED_TIME });
process.send({ ready: true });
process.once('message', ({ method, input }) => {
  try {
    process.send({ ok: true, receipt: service[method](input) });
  } catch (error) {
    process.send({ ok: false, code: error.code, message: error.message });
  } finally {
    repository.close();
    process.disconnect();
  }
});
