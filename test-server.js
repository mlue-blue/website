const { initializeDatabase } = require('./database');
const express = require('express');
const path = require('path');

async function testInit() {
  console.log('Testing Database Initialization...');
  try {
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }

  console.log('Testing Server Configuration...');
  try {
    const app = express();
    // Basic check for dependencies
    const multer = require('multer');
    const bcrypt = require('bcrypt');
    console.log('✅ All core dependencies are available');
  } catch (error) {
    console.error('❌ Dependency check failed:', error);
    process.exit(1);
  }

  console.log('All pre-run checks passed!');
  process.exit(0);
}

testInit();
