import { createClient } from '@supabase/supabase-js';

async function testLiveKitTokenWithServiceKey() {
  try {
    // Use service key instead of anon key for admin access
    const supabaseUrl = 'https://toguqsixflnbitxxbngi.supabase.co';
    const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvZ3Vxc2l4ZmxuYml0eHhiTmdpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTg3Njg3MCwiZXhwIjoyMDUxNDUyODcwfQ.6727000000000000000000000000000000000000000';
    
    const supabase = createClient(supabaseUrl, serviceKey);
    
    // Get the first user from the database
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (userError || !users || users.length === 0) {
      console.error('No users found or error fetching users:', userError);
      return;
    }
    
    const user = users[0];
    console.log('Using user:', user.id);
    
    // Create a JWT token for this user using the service key
    const { data: jwtData, error: jwtError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email
    });
    
    if (jwtError) {
      console.error('Error generating JWT:', jwtError);
      return;
    }
    
    console.log('Generated JWT for user:', user.email);
    
    // Now test the LiveKit token function
    const response = await fetch('https://toguqsixflnbitxxbngi.supabase.co/functions/v1/livekit-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify({
        roomName: 'main_show',
        canPublish: true,
        canSubscribe: true
      })
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(result, null, 2));

    if (result.token) {
      console.log('Token length:', result.token.length);
      console.log('Token format check:', result.token.split('.').length === 3 ? 'Valid JWT' : 'Invalid JWT');
    }

  } catch (error) {
    console.error('Error testing LiveKit token:', error);
  }
}

testLiveKitTokenWithServiceKey();