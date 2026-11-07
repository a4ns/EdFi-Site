import { id, quantity, timestamp, version } from './validation.js';

const rewardFields = ['id', 'issuerId', 'subjectId', 'sourceResultId', 'evidenceRef', 'quantity', 'unitId', 'status', 'version', 'createdAt', 'updatedAt'];
const receiptFields = ['kind', 'commandId', 'issuerId', 'actorId', 'action', 'idempotencyKey', 'recordedAt', 'reward'];
const ledgerFields = ['rewardId', 'direction', 'issuerId', 'subjectId', 'unitId', 'account', 'quantity', 'createdAt'];
const actions = { submitPending: 'submit', approve: 'approve', postCredit: 'post', revoke: 'revoke' };

export function exactObject(value, fields) {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype) return false;
  const keys = Reflect.ownKeys(value);
  return keys.length === fields.length && fields.every((field) => {
    const property = Object.getOwnPropertyDescriptor(value, field);
    return property && Object.hasOwn(property, 'value');
  });
}

function requireShape(valid) {
  if (!valid) throw new Error('Invalid service response');
}

function reward(value, input) {
  requireShape(exactObject(value, rewardFields));
  for (const key of ['id', 'issuerId', 'subjectId', 'sourceResultId', 'evidenceRef', 'unitId']) id(value[key], key);
  quantity(value.quantity);
  version(value.version);
  timestamp(value.createdAt);
  timestamp(value.updatedAt);
  requireShape(['pending', 'approved', 'posted', 'revoked'].includes(value.status));
  requireShape(value.issuerId === input.issuerId && (input.rewardId === undefined || value.id === input.rewardId));
}

// Validate the public DTO before serialization. Internal errors and accidental
// extra service fields must not become successful responses or leak details.
export function validateResponse(value, method, input) {
  try {
    if (method === 'getReward') reward(value, input);
    else if (method === 'getLedger') {
      requireShape(Array.isArray(value) && (value.length === 0 || value.length === 2));
      for (const line of value) {
        requireShape(exactObject(line, ledgerFields));
        for (const key of ['rewardId', 'issuerId', 'subjectId', 'unitId']) id(line[key], key);
        quantity(line.quantity);
        timestamp(line.createdAt);
        requireShape(line.issuerId === input.issuerId && line.rewardId === input.rewardId);
        requireShape(['debit', 'credit'].includes(line.direction));
        requireShape(line.account === (line.direction === 'debit' ? 'issuer_budget' : 'subject'));
      }
    } else {
      requireShape(exactObject(value, receiptFields));
      for (const key of ['commandId', 'issuerId', 'actorId', 'idempotencyKey']) id(value[key], key);
      timestamp(value.recordedAt);
      requireShape(value.kind === 'historical-command-receipt' && value.action === actions[method]);
      requireShape(value.issuerId === input.issuerId && value.idempotencyKey === input.idempotencyKey);
      reward(value.reward, input);
      if (method === 'submitPending') {
        for (const key of ['subjectId', 'sourceResultId', 'evidenceRef', 'quantity', 'unitId']) {
          requireShape(value.reward[key] === input[key]);
        }
      }
    }
  } catch {
    // Outbound validation failures are server failures, never client errors.
    throw new Error('Invalid service response');
  }
  return value;
}
