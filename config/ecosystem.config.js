module.exports = {
  apps: [
    {
      name: "hoc-bazaar",
      script: "./src/services/bazaar/index.js",

      // Runtime & Clustering
      instances: "max",
      exec_mode: "cluster",
      instance_var: "INSTANCE_ID",
      watch: false,
      combine_logs: true,
      node_args: ["--enable-source-maps", "--max-old-space-size=2048"],

      // Lifecycle
      autorestart: true,
      wait_ready: true,
      shutdown_with_message: true,
      min_uptime: "30s",
      listen_timeout: 8000,
      kill_timeout: 10000,
      restart_delay: 5000,
      max_restarts: 10,
      max_memory_restart: "2G",
      cron_restart: "0 4 * * *",

      // Logging
      error_file: "./logs/bazaar-err.log",
      out_file: "./logs/bazaar-out.log",
      pid_file: "./logs/bazaar.pid",
      merge_logs: true,
      time: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      source_map_support: true,

      env: { NODE_ENV: "production", SERVICE_NAME: "bazaar" },
      env_development: { NODE_ENV: "development", SERVICE_NAME: "bazaar" },
      env_staging: { NODE_ENV: "staging", SERVICE_NAME: "bazaar" },
      env_production: { NODE_ENV: "production", SERVICE_NAME: "bazaar" }
    },

    {
      name: "hoc-treasury",
      script: "./src/services/treasury/index.js",

      // Runtime
      instances: 1,
      exec_mode: "fork",
      watch: false,
      combine_logs: true,
      node_args: ["--enable-source-maps", "--max-old-space-size=1024"],

      // Lifecycle
      autorestart: true,
      wait_ready: true,
      shutdown_with_message: true,
      min_uptime: "30s",
      listen_timeout: 8000,
      kill_timeout: 10000,
      restart_delay: 5000,
      max_restarts: 10,
      max_memory_restart: "1G",
      cron_restart: "0 4 * * *",

      // Logging
      error_file: "./logs/treasury-err.log",
      out_file: "./logs/treasury-out.log",
      pid_file: "./logs/treasury.pid",
      merge_logs: true,
      time: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      source_map_support: true,

      env: { NODE_ENV: "production", SERVICE_NAME: "treasury" },
      env_development: { NODE_ENV: "development", SERVICE_NAME: "treasury" },
      env_staging: { NODE_ENV: "staging", SERVICE_NAME: "treasury" },
      env_production: { NODE_ENV: "production", SERVICE_NAME: "treasury" }
    }
  ]
};
