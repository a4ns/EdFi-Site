import { randomUUID } from 'node:crypto';
import { fail } from './errors.js';
import { canonical, id, immutable, object, quantity, timestamp, version } from './validation.js';

const transitionActions = { approve: 'approve', postCredit: 'post', revoke: 'revoke' };

/**
 * Synchronous reference boundary. Context is opaque and grants no authority.
 * A future trusted server adapter must authenticate and authorize each request.
 */
export function createRewardService({ repository, issuerAuthorization = () => ({ allowed: false }), clock = () => new Date().toISOString() } = {}) {
  if (!repository || !['execute', 'getReward', 'getLedger'].every((name) => typeof repository[name] === 'function')) {
    throw new TypeError('A reward repository is required');
  }
  if (typeof issuerAuthorization !== 'function' || typeof clock !== 'function') {
    throw new TypeError('issuerAuthorization and clock must be functions');
  }

  function authorize(context, issuerId, action, resource) {
    let actorId;
    try {
      const request = Object.freeze({ context, issuerId, action, resource: immutable(resource) });
      const decision = issuerAuthorization(request);
      // Do not accidentally accept promises or truthy values as permission.
      if (decision && typeof decision.then === 'function') {
        // Observe a native rejected promise to avoid an unhandled rejection.
        if (decision instanceof Promise) decision.catch(() => {});
        fail('FORBIDDEN', 'Authorization must be synchronous');
      }
      object(decision, ['allowed', 'actorId', 'issuerId', 'action', 'resource'], 'authorization decision');
      if (decision.allowed !== true || decision.issuerId !== issuerId || decision.action !== action ||
          canonical(decision.resource) !== canonical(resource)) {
        fail('FORBIDDEN', 'Authorization denied');
      }
      actorId = id(decision.actorId, 'authorized actorId');
    } catch {
      fail('FORBIDDEN', 'Authorization denied');
    }
    return actorId;
  }

  function execute(input, action, payload, resource) {
    const issuerId = id(input.issuerId, 'issuerId');
    const idempotencyKey = id(input.idempotencyKey, 'idempotencyKey');
    const actorId = authorize(input.context, issuerId, action, resource);
    const command = immutable({ issuerId, actorId, action, idempotencyKey, ...payload });
    return immutable(repository.execute(command, () => {
      const now = clock();
      if (now instanceof Promise) now.catch(() => {});
      return { commandId: randomUUID(), rewardId: randomUUID(), recordedAt: timestamp(now) };
    }));
  }

  const service = {
    submitPending(input) {
      object(input, ['issuerId', 'subjectId', 'sourceResultId', 'evidenceRef', 'quantity', 'unitId', 'idempotencyKey', 'context'], 'submitPending input');
      const payload = {
        subjectId: id(input.subjectId, 'subjectId'),
        sourceResultId: id(input.sourceResultId, 'sourceResultId'),
        evidenceRef: id(input.evidenceRef, 'evidenceRef'),
        quantity: quantity(input.quantity),
        unitId: id(input.unitId, 'unitId'),
      };
      return execute(input, 'submit', payload, { subjectId: payload.subjectId, sourceResultId: payload.sourceResultId });
    },
    getReward(input) {
      object(input, ['issuerId', 'rewardId', 'context'], 'getReward input');
      const issuerId = id(input.issuerId, 'issuerId');
      const rewardId = id(input.rewardId, 'rewardId');
      authorize(input.context, issuerId, 'read', { kind: 'reward', rewardId });
      return immutable(repository.getReward({ issuerId, rewardId }));
    },
    getLedger(input) {
      object(input, ['issuerId', 'rewardId', 'context'], 'getLedger input');
      const issuerId = id(input.issuerId, 'issuerId');
      const rewardId = id(input.rewardId, 'rewardId');
      authorize(input.context, issuerId, 'read', { kind: 'ledger', rewardId });
      return immutable(repository.getLedger({ issuerId, rewardId }));
    },
  };
  for (const [method, action] of Object.entries(transitionActions)) {
    service[method] = (input) => {
      object(input, ['issuerId', 'rewardId', 'expectedVersion', 'idempotencyKey', 'context'], `${method} input`);
      const payload = { rewardId: id(input.rewardId, 'rewardId'), expectedVersion: version(input.expectedVersion) };
      return execute(input, action, payload, { rewardId: payload.rewardId });
    };
  }
  return Object.freeze(service);
}
