const nodemailer = require('nodemailer');

console.log('🔄 Generating Ethereal Email credentials...\n');

nodemailer.createTestAccount((err, account) => {
  if (err) {
    console.error('❌ Failed to create test account:', err);
    process.exit(1);
  }
  
  console.log('✅ Ethereal Email Account Created!\n');
  console.log('📋 Copy these lines to your .env file:\n');
  console.log('EMAIL_HOST="' + account.smtp.host + '"');
  console.log('EMAIL_PORT=' + account.smtp.port);
  console.log('EMAIL_SECURE=' + account.smtp.secure);
  console.log('EMAIL_USER="' + account.user + '"');
  console.log('EMAIL_PASSWORD="' + account.pass + '"');
  console.log('EMAIL_FROM="' + account.user + '"');
  console.log('\n📧 View sent emails at: https://ethereal.email/messages');
  console.log('🔑 Login credentials:');
  console.log('   Username: ' + account.user);
  console.log('   Password: ' + account.pass);
  console.log('\n💡 These credentials are for DEVELOPMENT only!');
});
