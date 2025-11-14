#!/usr/bin/env node

/**
 * Development server script for Alerting Service
 * This script starts the service with development-friendly settings
 */

// Set development environment variables
process.env.NODE_ENV = 'development';
process.env.PORT = process.env.PORT || '3001';
process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';
process.env.REDIS_DB = process.env.REDIS_DB || '0';

// Start the main application
require('./dist/index.js');