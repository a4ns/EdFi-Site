import { DatabaseSync } from 'node:sqlite';
import { writeSync } from 'node:fs';
import { createRewardService, createSqliteRewardRepository } from '../src/index.js';
import { authorize, NOW } from './adversarial-helpers.js';

const [filename, crashPoint, serializedInput] = process.argv.slice(2);
const repository = createSqliteRewardRepository({ filename, busyTimeoutMs: 500 });
const service = createRewardService({ repository, issuerAuthorization: authorize, clock: () => NOW });
const prepare = DatabaseSync.prototype.prepare;
const exec = DatabaseSync.prototype.exec;

function terminateAfter(sql) {
  const isCommit = /^\s*COMMIT\s*;?\s*$/i.test(sql);
  const isWrite = new RegExp(`^\\s*(?:INSERT\\s+INTO|UPDATE)\\s+["\x60]?${crashPoint}\\b`, 'i').test(sql);
  if ((crashPoint === 'commit' && isCommit) || (crashPoint !== 'commit' && isWrite)) {
    writeSync(1, `reached:${crashPoint}\n`);
    process.kill(process.pid, 'SIGKILL');
  }
}

DatabaseSync.prototype.prepare = function (sql, ...args) {
  const statement = Reflect.apply(prepare, this, [sql, ...args]);
  const run = statement.run;
  statement.run = function (...values) {
    const result = Reflect.apply(run, this, values);
    terminateAfter(sql);
    return result;
  };
  return statement;
};
DatabaseSync.prototype.exec = function (sql, ...args) {
  const result = Reflect.apply(exec, this, [sql, ...args]);
  terminateAfter(sql);
  return result;
};

try {
  service.postCredit(JSON.parse(serializedInput));
  writeSync(1, 'ERROR: crash point was not reached\n');
  process.exitCode = 2;
} catch (error) {
  writeSync(2, `${error.stack}\n`);
  process.exitCode = 3;
} finally {
  repository.close();
}
