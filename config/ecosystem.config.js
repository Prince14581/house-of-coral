module.exports = {
  apps: [{
    name: "house-of-coral",
    script: "./server.js",
    // Use 'max' to utilize all CPU cores for your 8-pillar ecosystem
    instances: "max",
    exec_mode: "cluster",
    // Automatic protection: restart if it crashes or exceeds memory
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    // Environment-specific configuration
    env: {
      NODE_ENV: "production",
    },
    // High-Integrity logging: These logs are your audit trail
    error_file: "./logs/err.log",
    out_file: "./logs/out.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss"
  }]
};
