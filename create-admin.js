// Admin User Creation Script
// Run this to create your first admin user

const { createClient } = require('@supabase/supabase-js');

// Use your service role key for admin operations
const supabaseUrl = 'https://yrknpwyindvfevhkionn.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlya25wd3lpbmR2ZmV2aGtpb25uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjIwNzcxMSwiZXhwIjoyMDcxNzgzNzExfQ.UlguKrMGy2kWvanmu5zPrmCgPeq7EvU178SolpgUJ4g';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  console.log('🚀 Creating Admin User for Inspirasiinee...\n');

  const adminEmail = 'admin@inspirasinee.com';
  const adminPassword = 'inspirasinee123'; // Change this after first login!

  try {
    // 1. Create the user in Supabase Auth
    console.log('1. Creating admin user in Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        is_admin: true
      }
    });

    if (authError) {
      console.log('❌ Error creating auth user:', authError.message);
      return;
    }

    console.log('✅ Auth user created successfully');
    const userId = authData.user.id;
    console.log(`📧 User ID: ${userId}`);

    // 2. Add user to admin_users table
    console.log('\n2. Adding user to admin_users table...');
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .upsert({
        id: userId,
        email: adminEmail,
        role: 'admin'
      })
      .select();

    if (adminError) {
      console.log('❌ Error adding to admin_users:', adminError.message);
      return;
    }

    console.log('✅ Admin user created successfully!');

    // 3. Test the login
    console.log('\n3. Testing admin login...');
    const testClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

    const { data: loginData, error: loginError } = await testClient.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });

    if (loginError) {
      console.log('❌ Login test failed:', loginError.message);
    } else {
      console.log('✅ Login test successful!');
    }

    console.log('\n🎉 Setup Complete!');
    console.log('\n📋 Admin Login Details:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

createAdminUser();