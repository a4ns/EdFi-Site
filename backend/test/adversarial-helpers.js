import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { Worker } from 'node:worker_threads';
import { spawn } from 'node:child_process';
import { createRewardService, createSqliteRewardRepository } from '../src/index.js';

export const NOW = '2026-10-05T12:00:00.000Z';
export const ISSUER = 'synthetic-issuer-a';
export const OTHER_ISSUER = 'synthetic-issuer-b';
export const UNIT = 'synthetic-unit';

export function authorize({ context, issuerId, action, resource }) {
  const principals = {
    'session-a': { actorId: 'synthetic-actor-a', issuerId: ISSUER },
    'session-a2': { actorId: 'synthetic-actor-a2', issuerId: ISSUER },
    'session-b': { actorId: 'synthetic-actor-b', issuerId: OTHER_ISSUER },
  };
  const principal = principals[context];
  if (!principal || principal.issuerId !== issuerId) return { allowed: false };
  return { allowed: true, actorId: principal.actorId, issuerId, action, resource };
}

export function fixture(t, { total, issuerAuthorization = authorize, filename } = {}) {
  const directory = filename ? null : mkdtempSync(join(tmpdir(), 'edfi-independent-'));
  const dbPath = filename ?? join(directory, 'synthetic.sqlite');
  const repository = createSqliteRewardRepository({ filename: dbPath, busyTimeoutMs: 500 });
  const inspector = new DatabaseSync(dbPath);
  if (total !== undefined) {
    inspector.prepare('INSERT INTO budgets (issuer_id, unit_id, total) VALUES (?, ?, ?)')
      .run(ISSUER, UNIT, total);
  }
  const service = createRewardService({ repository, issuerAuthorization, clock: () => NOW });
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    inspector.close();
    repository.close();
  };
  t.after(() => {
    close();
    if (directory) rmSync(directory, { recursive: true, force: true });
  });
  return { service, repository, inspector, filename: dbPath, close };
}

export function submission(overrides = {}) {
  return {
    issuerId: ISSUER,
    subjectId: 'synthetic-subject-secret-marker',
    sourceResultId: 'synthetic-result-1',
    evidenceRef: 'synthetic-evidence-secret-marker',
    quantity: '7',
    unitId: UNIT,
    idempotencyKey: 'submit-1',
    context: 'session-a',
    ...overrides,
  };
}

export function transition(receipt, idempotencyKey, overrides = {}) {
  return {
    issuerId: receipt.issuerId,
    rewardId: receipt.reward.id,
    expectedVersion: receipt.reward.version,
    idempotencyKey,
    context: receipt.issuerId === OTHER_ISSUER ? 'session-b' : 'session-a',
    ...overrides,
  };
}

export function readInput(receipt, overrides = {}) {
  return {
    issuerId: receipt.issuerId,
    rewardId: receipt.reward.id,
    context: receipt.issuerId === OTHER_ISSUER ? 'session-b' : 'session-a',
    ...overrides,
  };
}

export function rejected(operation) {
  let caught;
  try { operation(); } catch (error) { caught = error; }
  assert.ok(caught, 'Operation must fail');
  assert.equal(typeof caught.code, 'string', 'Failure has a stable code');
  return caught;
}

function quoteIdentifier(identifier) {
  return '"' + identifier.replaceAll('"', '""') + '"';
}

export function snapshot(db) {
  const tables = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT GLOB 'sqlite_*' ORDER BY name").all();
  return Object.fromEntries(tables.map(({ name }) => [name,
    db.prepare(`SELECT * FROM ${quoteIdentifier(name)}`).all()
      .map(row => JSON.parse(JSON.stringify(row)))
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
  ]));
}

export function budget(db, issuerId = ISSUER, unitId = UNIT) {
  const row = db.prepare('SELECT total, reserved, spent FROM budgets WHERE issuer_id=? AND unit_id=?')
    .get(issuerId, unitId);
  if (!row) return { total: '0', reserved: '0', spent: '0' };
  return { ...row };
}

export function assertLedger(entries, reward) {
  assert.equal(entries.length, 2, 'Exactly two entries per posted reward');
  assert.deepEqual(entries.map(entry => entry.direction).sort(), ['credit', 'debit']);
  assert.equal(new Set(entries.map(entry => entry.account)).size, 2);
  for (const entry of entries) {
    assert.equal(entry.quantity, reward.quantity);
    assert.equal(entry.issuerId, reward.issuerId);
    assert.equal(entry.rewardId, reward.id);
    assert.equal(entry.unitId, reward.unitId);
    assert.equal(entry.subjectId, reward.subjectId);
    assert.equal(entry.account, entry.direction === 'credit' ? 'subject' : 'issuer_budget');
    assert.equal(typeof entry.quantity, 'string');
  }
}

export async function race(filename, commands) {
  const start = new SharedArrayBuffer(4);
  const gate = new Int32Array(start);
  const workers = commands.map(command => new Worker(new URL('./adversarial-race-worker.js', import.meta.url), {
    workerData: { filename, command, start },
  }));
  const outcomes = workers.map(worker => new Promise((resolve, reject) => {
    worker.once('error', reject);
    worker.on('message', message => {
      if (message.kind === 'result') resolve(message);
    });
    worker.once('exit', code => {
      if (code !== 0) reject(new Error(`Race worker exited ${code}`));
    });
  }));
  try {
    await Promise.all(workers.map(worker => new Promise((resolve, reject) => {
      worker.once('error', reject);
      worker.on('message', message => { if (message.kind === 'ready') resolve(); });
    })));
    Atomics.store(gate, 0, 1);
    Atomics.notify(gate, 0, workers.length);
    return await Promise.all(outcomes);
  } finally {
    await Promise.all(workers.map(worker => worker.terminate()));
  }
}

export async function crashPost(filename, point, input) {
  return await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [
      '--experimental-sqlite', new URL('./adversarial-crash-worker.js', import.meta.url).pathname,
      filename, point, JSON.stringify(input),
    ], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', data => { stdout += data; });
    child.stderr.on('data', data => { stderr += data; });
    child.once('error', reject);
    child.once('close', (code, signal) => resolve({ code, signal, stdout, stderr }));
  });
}
