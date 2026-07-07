const IntegrityService = require('../src/services/IntegrityService');

// 1. Strict Protocol Mocking
const mockProtocol = {
  SUPPORTED_VERSIONS: new Set([1, 2]),
  TYPES: new Set(['GAME_MOVE']),
  ACTIONS: new Set(['MOVE']),
  SCHEMA: { 'GAME_MOVE': { x: { type: 'number' }, y: { type: 'number' } } }
};
jest.mock('../shared/protocol', () => mockProtocol);

describe('IntegrityService 100/100 Enterprise Benchmark', () => {
  let service;
  const mockStore = { evalsha: jest.fn(), script: jest.fn().mockResolvedValue('sha123'), del: jest.fn() };
  const mockLogger = { warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
  const mockMetrics = { emit: jest.fn() };
  const context = { sessionId: 'sid-1', ip: '1.1.1.1', deviceId: 'dev-1' };
  const secrets = { current: 'a'.repeat(32), previous: 'b'.repeat(32) };

  beforeEach(() => {
    service = new IntegrityService(mockStore, mockLogger, mockMetrics);
    jest.clearAllMocks();
  });

  // 2. Constructor & Dependency Validation
  test('Should throw if dependencies are missing', () => {
    expect(() => new IntegrityService(null, mockLogger, mockMetrics)).toThrow();
  });

  // 3. Lua Return Code Coverage
  test('Should map all Lua return codes to security events', async () => {
    const map = { 1: 'session_expired', 2: 'rate_limit', 3: 'seq_err', 4: 'replay', 5: 'binding_err', 6: 'drift_err', 7: 'nonce_full', 99: 'atomic_err' };
    for (const [code, reason] of Object.entries(map)) {
      mockStore.evalsha.mockResolvedValueOnce(Number(code));
      const p = { version: 1, type: 'GAME_MOVE', action: 'MOVE', seq: 1, nonce: '1234567890abcdef1234567890abcdef', timestamp: Date.now(), payload: { x: 1, y: 1 } };
      await service.verifyPacket(p, service.signPacket(p, secrets.current), secrets, context);
      expect(mockMetrics.emit).toHaveBeenCalledWith('security_violation', expect.objectContaining({ reason }));
    }
  });

  // 4. Secret Rotation (Current & Previous)
  test('Should accept current and previous secrets', async () => {
    mockStore.evalsha.mockResolvedValue(100);
    const p = { version: 1, type: 'GAME_MOVE', action: 'MOVE', seq: 1, nonce: '1234567890abcdef1234567890abcdef', timestamp: Date.now(), payload: { x: 1, y: 1 } };
    
    expect(await service.verifyPacket(p, service.signPacket(p, secrets.current), secrets, context)).toBe(true);
    expect(await service.verifyPacket(p, service.signPacket(p, secrets.previous), secrets, context)).toBe(true);
  });

  // 5. Malformed Input Rejection
  test('Should reject malformed packets without throwing', async () => {
    const inputs = [null, undefined, 42, "string", [], { payload: null }];
    for (const input of inputs) {
      await expect(service.verifyPacket(input, 'a'.repeat(64), secrets, context)).resolves.toBe(false);
    }
  });

  // 6. Signature & Nonce Rigor
  test('Should reject invalid signatures and nonces', async () => {
    const p = { version: 1, type: 'GAME_MOVE', action: 'MOVE', seq: 1, nonce: 'short', timestamp: Date.now(), payload: { x: 1, y: 1 } };
    expect(await service.verifyPacket(p, 'invalid-sig', secrets, context)).toBe(false);
  });

  // 7. NOSCRIPT Recovery Implementation
  test('Should recover from NOSCRIPT errors', async () => {
    mockStore.evalsha.mockRejectedValueOnce(new Error('NOSCRIPT'));
    mockStore.evalsha.mockResolvedValueOnce(100);
    const p = { version: 1, type: 'GAME_MOVE', action: 'MOVE', seq: 1, nonce: '1234567890abcdef1234567890abcdef', timestamp: Date.now(), payload: { x: 1, y: 1 } };
    
    await service.verifyPacket(p, service.signPacket(p, secrets.current), secrets, context);
    expect(mockStore.script).toHaveBeenCalled();
    expect(mockStore.evalsha).toHaveBeenCalledTimes(2);
  });
});
