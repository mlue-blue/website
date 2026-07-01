const { adminExists, createAdmin } = require('./database');

async function checkAndCreateAdmin() {
  try {
    const exists = await adminExists('admin');
    if (!exists) {
      console.log('No admin user found. Creating default admin...');
      await createAdmin('admin', 'admin123');
      console.log('✅ Default admin created (User: admin, Pass: admin123)');
    } else {
      console.log('✅ Admin user "admin" already exists.');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAndCreateAdmin();
