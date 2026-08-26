import test from 'node:test';
import assert from 'node:assert/strict';

process.env.UIN_LOG_LEVEL = 'debug';
const { createLogger } = await import('../packages/uin-core/src/logger.js');

test('structured logger emits context', () => {
  const old = console.debug;
  let captured;
  console.debug = (_message, payload) => { captured = payload; };
  try {
    createLogger('test').debug('operation complete', { objectId: 'x1' });
    assert.equal(captured.scope, 'test');
    assert.equal(captured.objectId, 'x1');
    assert.equal(captured.message, 'operation complete');
  } finally {
    console.debug = old;
  }
});
