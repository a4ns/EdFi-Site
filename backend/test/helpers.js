import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createRewardService, createSqliteRewardRepository } from '../src/index.js';

export const FIXED_TIME = '2026-01-01T00:00:00.000Z';
export const UNIT = 'synthetic-test-units';

// This is test-only authority, never a production authentication adapter.
export function testAuthorization({ context, issuerId, action, resource }) {
  if (context?.session !== issuerId || context?.deniedAction === action) return { allowed: false };
  return { allowed: true, actorId: context?.secondActor ? 'test-actor-2' : 'test-actor-1', issuerId, action, resource };
}

export function fixture(t, { total = '100', issuerAuthorization = testAuthorization, clock = () => FIXED_TIME, busyTimeoutMs = 1000 } = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'edfi-offline-test-'));
  const filename = join(directory, 'reference.sqlite');
  const repositories = [];
  function open(options = {}) {
    const repository = createSqliteRewardRepository({ filename, busyTimeoutMs, ...options });
    repositories.push(repository);
    return repository;
  }
  const repository = open();
  // Synthetic provisioning exists only in test fixtures, outside the service API.
  const inspect = new DatabaseSync(filename);
  inspect.exec('PRAGMA foreign_keys = ON');
  if (total !== null) inspect.prepare('INSERT INTO budgets (issuer_id, unit_id, total) VALUES (?, ?, ?)').run('issuer-a', UNIT, total);
  const service = createRewardService({ repository, issuerAuthorization, clock });
  t.after(() => {
    for (const instance of repositories) instance.close();
    inspect.close();
    rmSync(directory, { recursive: true, force: true });
  });
  return { filename, repository, service, inspect, open };
}

export function submission(overrides = {}) {
  return { issuerId: 'issuer-a', subjectId: 'synthetic-subject-1', sourceResultId: 'synthetic-result-1', evidenceRef: 'opaque-evidence-1',
    quantity: '10', unitId: UNIT, idempotencyKey: 'submit-1', context: { session: 'issuer-a' }, ...overrides };
}

export function transition(receipt, overrides = {}) {
  return { issuerId: receipt.reward.issuerId, rewardId: receipt.reward.id, expectedVersion: receipt.reward.version,
    idempotencyKey: `next-${receipt.reward.version}`, context: { session: receipt.reward.issuerId }, ...overrides };
}

export function read(receipt, overrides = {}) {
  return { issuerId: receipt.reward.issuerId, rewardId: receipt.reward.id, context: { session: receipt.reward.issuerId }, ...overrides };
}

export function budget(inspect) {
  return { ...inspect.prepare('SELECT total, reserved, spent FROM budgets WHERE issuer_id = ? AND unit_id = ?').get('issuer-a', UNIT) };
}

export const code = (expected) => (error) => error?.code === expected;
