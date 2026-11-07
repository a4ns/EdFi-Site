import { parentPort, workerData } from 'node:worker_threads';
import { createRewardService, createSqliteRewardRepository } from '../src/index.js';
import { authorize, NOW } from './adversarial-helpers.js';

const { filename, command, start } = workerData;
const repository = createSqliteRewardRepository({ filename, busyTimeoutMs: 1500 });
const service = createRewardService({ repository, issuerAuthorization: authorize, clock: () => NOW });
parentPort.postMessage({ kind: 'ready' });
Atomics.wait(new Int32Array(start), 0, 0);
try {
  const receipt = service[command.method](command.input);
  parentPort.postMessage({ kind: 'result', ok: true, receipt });
} catch (error) {
  parentPort.postMessage({ kind: 'result', ok: false, error: { code: error.code, message: error.message } });
} finally {
  repository.close();
}
