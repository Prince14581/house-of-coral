const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { z } = require('zod');
const { logger } = require('./logger');
const { metrics } = require('./metrics');

const SUPPORTED_VERSIONS = ['1.0.0'];
const parsedInterval = Number(process.env.SHADOW_WATCHDOG_INTERVAL);
const WATCHDOG_INTERVAL_MS = Number.isInteger(parsedInterval) && parsedInterval > 0 ? parsedInterval : 300000;

const ShadowSchema = z.object({
  DB_URI: z.string().url(),
  VAULT_DB_URI: z.string().url(),
  SHADOW_MODE: z.string().transform(val => val === 'true'),
  CONFIG_VERSION: z.string().regex(/^\d+\.\d+\.\d+$/)
});

let state = { initialized: false, initializing: false, shadowEnabled: false, shadowConfig: null, originalEnvSnapshot: null, integrityInterval: null, lastIntegrityCheck: null, lastIntegrityFailure: null };
let signalsRegistered = false;

const shutdownHandler = () => shutdownShadow();
const registerSignals = () => {
  if (signalsRegistered) return;
  ['SIGINT', 'SIGTERM', 'beforeExit'].forEach(sig => process.once(sig, shutdownHandler));
  signalsRegistered = true;
};

const unregisterSignals = () => {
  ['SIGINT', 'SIGTERM', 'beforeExit'].forEach(sig => process.off(sig, shutdownHandler));
  signalsRegistered = false;
};

const startWatchdog = () => {
  if (state.integrityInterval) { clearInterval(state.integrityInterval); state.integrityInterval = null; }
  const interval = setInterval(() => { 
    try { 
      verifyIntegrity(); 
      metrics.increment('shadow_security_integrity_pass');
    } catch (e) { 
      state.lastIntegrityFailure = e.message;
      logger.error('WATCHDOG_FAILURE', { err: e.message });
      metrics.increment('shadow_security_tamper_alert');
      clearInterval(state.integrityInterval);
      state.integrityInterval = null;
    } 
  }, WATCHDOG_INTERVAL_MS);
  if (interval.unref) interval.unref();
  state.integrityInterval = interval;
};

const deepFreeze = (obj, visited = new WeakSet()) => {
  if (obj === null || typeof obj !== 'object' || visited.has(obj)) return obj;
  visited.add(obj);
  Reflect.ownKeys(obj).forEach(key => {
    const value = obj[key];
    if (value && typeof value === 'object') deepFreeze(value, visited);
  });
  return Object.freeze(obj);
};

const verifyIntegrity = () => {
  if (!state.initialized || !state.shadowConfig) throw new Error('Shadow environment not initialized');
  let buffer;
  try { buffer = fs.readFileSync(state.shadowConfig.envPath); }
  catch { throw new Error('Shadow configuration file unavailable'); }
  
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  if (hash !== state.shadowConfig.fingerprint) {
    const errorMsg = `Tamper detected: expected ${state.shadowConfig.fingerprint.substring(0, 8)}, got ${hash.substring(0, 8)} (Ver: ${state.shadowConfig.CONFIG_VERSION})`;
    throw new Error(errorMsg);
  }
  state.lastIntegrityCheck = new Date().toISOString();
};

function shutdownShadow() {
  if (!state.originalEnvSnapshot) return;
  Object.keys(process.env).forEach(key => { if (!(key in state.originalEnvSnapshot)) delete process.env[key]; });
  Object.assign(process.env, state.originalEnvSnapshot);
  if (state.integrityInterval) { clearInterval(state.integrityInterval); state.integrityInterval = null; }
  unregisterSignals();
  state = { initialized: false, initializing: false, shadowEnabled: false, shadowConfig: null, originalEnvSnapshot: null, integrityInterval: null, lastIntegrityCheck: null, lastIntegrityFailure: null };
  metrics.increment('shadow_environment_shutdown');
  logger.info('SHADOW_SHUTDOWN_SUCCESS');
}

function initShadow(isReload = false) {
  if (state.initializing) throw new Error('Shadow initialization in progress');
  state.initializing = true;
  const snapshot = { ...process.env };

  try {
    // Bootstrap flag design: SHADOW_MODE is handled as an external bootstrap feature flag.
    if (process.env.SHADOW_MODE !== 'true') return (state.initialized = true, false);
    
    const envPath = path.resolve(process.env.SHADOW_ENV_PATH || '../.env.shadow');
    if (!envPath.endsWith('.env.shadow')) throw new Error('Invalid filename');
    
    const fileBuffer = fs.readFileSync(envPath);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    if (process.env.EXPECTED_SHADOW_HASH && hash !== process.env.EXPECTED_SHADOW_HASH) throw new Error('Checksum mismatch');

    const result = dotenv.config({ path: envPath, override: false });
    if (result.error) throw result.error;
    if (!process.env.DB_URI || !process.env.VAULT_DB_URI) throw new Error('Missing critical environment keys');

    const validated = ShadowSchema.safeParse(process.env);
    if (!validated.success) throw new Error(`Schema validation failed: ${JSON.stringify(validated.error.format())}`);
    if (!SUPPORTED_VERSIONS.includes(validated.data.CONFIG_VERSION)) throw new Error('Unsupported config version');
    
    state.shadowConfig = new Proxy(deepFreeze({ ...validated.data, fingerprint: hash, envPath, startedAt: Date.now() }), { set: () => { throw new Error('Read-only'); } });
    state.shadowEnabled = true;
    state.originalEnvSnapshot = snapshot;
    state.initialized = true;
    state.lastIntegrityFailure = null;
    startWatchdog();
    registerSignals();
    
    logger.info(isReload ? 'SHADOW_RELOAD_SUCCESS' : 'SHADOW_STARTED');
    return true;
  } catch (err) {
    Object.keys(process.env).forEach(k => { if (!(k in snapshot)) delete process.env[k]; });
    Object.assign(process.env, snapshot);
    logger.error('SHADOW_INIT_FAILED', { message: err.message, stack: err.stack });
    throw err;
  } finally { state.initializing = false; }
}

module.exports = {
  initShadow, shutdownShadow,
  isInitialized: () => state.initialized,
  isShadowEnabled: () => state.shadowEnabled,
  reloadShadow: () => {
    if (!state.initialized) throw new Error('Cannot reload uninitialized shadow');
    metrics.increment('shadow_reload_started');
    
    const oldSnapshot = state.originalEnvSnapshot ? { ...state.originalEnvSnapshot } : {};
    const oldConfig = state.shadowConfig;
    const oldInitialized = state.initialized;
    const oldShadowEnabled = state.shadowEnabled;
    const oldLastIntegrityCheck = state.lastIntegrityCheck;
    const oldLastIntegrityFailure = state.lastIntegrityFailure;

    try {
      shutdownShadow();
      return initShadow(true);
    } catch (e) {
      Object.keys(process.env).forEach(k => { if (!(k in oldSnapshot)) delete process.env[k]; });
      Object.assign(process.env, oldSnapshot);
      state = {
        initialized: oldInitialized,
        initializing: false,
        shadowEnabled: oldShadowEnabled,
        shadowConfig: oldConfig,
        originalEnvSnapshot: oldSnapshot,
        integrityInterval: null,
        lastIntegrityCheck: oldLastIntegrityCheck,
        lastIntegrityFailure: oldLastIntegrityFailure
      };
      if (state.initialized) { startWatchdog(); registerSignals(); }
      throw e;
    }
  },
  getShadowHealth: () => {
    try { verifyIntegrity(); } catch (err) { return { healthy: false, error: err.message }; }
    return {
      healthy: true,
      initialized: state.initialized,
      shadowEnabled: state.shadowEnabled,
      configVersion: state.shadowConfig?.CONFIG_VERSION,
      fingerprint: state.shadowConfig?.fingerprint?.substring(0, 8),
      lastIntegrityCheck: state.lastIntegrityCheck,
      lastIntegrityFailure: state.lastIntegrityFailure,
      uptime: state.shadowConfig ? Date.now() - state.shadowConfig.startedAt : 0
    };
  },
  getShadowConfig: () => { verifyIntegrity(); const { DB_URI, VAULT_DB_URI, ...rest } = state.shadowConfig; return { ...rest, DB_URI: '***', VAULT_DB_URI: '***' }; }
};
