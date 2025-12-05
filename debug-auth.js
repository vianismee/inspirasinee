// Debug script to test Supabase connection and authentication
const { createClient } = require('@supabase/supabase-js');

// Use your environment variables
const supabaseUrl = 'https://yrknpwyindvfevhkionn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlya25wd3lpbmR2ZmV2aGtpb25uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDc3MTEsImV4cCI6MjA3MTc4MzcxMX0.zC68rsiFeiPfqDTVUzyba6Ls-ADXWJbw4_P-Po1f-lU';

console.log('🔍 Testing Supabase Connection and Authentication...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  try {
    // 1. Test basic connection
    console.log('1. Testing basic connection...');
    const { data, error } = await supabase.from('admin_users').select('count').single();
    if (error) {
      console.log('❌ Admin users table not found or error:', error.message);
    } else {
      console.log('✅ Admin users table found');
    }

    // 2. Check if auth.users table exists (Supabase Auth)
    console.log('\n2. Testing Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    console.log('Auth system response:', authError ? authError.message : 'Auth system working');

    // 3. Check existing admin users
    console.log('\n3. Checking for existing admin users...');
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .limit(5);

    if (adminError) {
      console.log('❌ Cannot access admin_users:', adminError.message);
    } else {
      console.log('📋 Found admin users:', adminUsers?.length || 0);
      if (adminUsers?.length > 0) {
        console.log('Admin users:', adminUsers.map(u => ({ email: u.email, role: u.role })));
      }
    }

    // 4. Test regular users auth
    console.log('\n4. Testing authentication with sample credentials...');
    const testLogin = await supabase.auth.signInWithPassword({
      email: 'admin@inspirasinee.com', // Common admin email pattern
      password: 'admin123' // Common test password
    });

    if (testLogin.error) {
      console.log('❌ Test login failed:', testLogin.error.message);
      console.log('💡 You may need to create an admin user first');
    } else {
      console.log('✅ Test login successful!');
      console.log('User:', testLogin.data.user?.email);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testAuth();