const mongoose = require('mongoose');
const { logger } = require('./logger');
const { metrics } = require('./metrics');

class DatabaseEngine {
  constructor(config) {
    this.config = this.validateConfig(config);
    this.connections = new Map();
    this.isShuttingDown = false;
  }

  validateConfig(config) {
    const required = ['DB_URI', 'VAULT_DB_URI'];
    required.forEach(key => { if (!config[key]) throw new Error(`Missing config: ${key}`); });
    return config;
  }

  getConnection(name) {
    const conn = this.connections.get(name);
    if (!conn) throw new Error(`Connection ${name} not initialized`);
    return conn;
  }

  isReady() {
    return !this.isShuttingDown && 
           Array.from(this.connections.values()).every(c => c.readyState === 1);
  }

  getHealth() {
    const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    return Array.from(this.connections.entries()).map(([name, conn]) => ({
      name, status: states[conn.readyState] || 'unknown'
    }));
  }

  async connectWithRetry(name, uri, attempt = 0) {
    try {
      const conn = await mongoose.createConnection(uri, {
        maxPoolSize: this.config.POOL_SIZE || 50,
        serverSelectionTimeoutMS: 5000,
        tls: this.config.DB_TLS === 'true'
      }).asPromise();
      this.setupListeners(name, conn);
      this.connections.set(name, conn);
      return conn;
    } catch (err) {
      if (attempt < 5) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
        return this.connectWithRetry(name, uri, attempt + 1);
      }
      throw err;
    }
  }

  setupListeners(name, conn) {
    conn.on('connected', () => { logger.info(`Connected: ${name}`); metrics.increment('db_connected', { name }); });
    conn.on('disconnected', () => { logger.warn(`Disconnected: ${name}`); metrics.increment('db_disconnected', { name }); });
    conn.on('error', (e) => { logger.error(`Error [${name}]:`, e); metrics.increment('db_errors', { name }); });
  }

  async withTransaction(name, callback) {
    if (this.isShuttingDown) throw new Error('Engine is shutting down');
    const session = await this.getConnection(name).startSession();
    try {
      return await session.withTransaction(callback, {
        readPreference: 'primary', readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' }
      });
    } finally {
      await session.endSession();
    }
  }

  async shutdown() {
    this.isShuttingDown = true;
    logger.info('Database engine: Draining connections...');
    await Promise.all(Array.from(this.connections.values()).map(c => c.close()));
    logger.info('Database engine: Shutdown complete.');
  }
}

module.exports = DatabaseEngine;
