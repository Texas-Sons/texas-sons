require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (users.users.length === 0) {
    console.log("No users found");
    return;
  }
  const ownerId = users.users[0].id;
  
  const intakeId = 'intake-waylon-rogers';
  const { data, error } = await supabase
    .from('client_intakes')
    .insert([
      {
        id: intakeId,
        owner_id: ownerId,
        data: { businessName: 'Waylon Rogers for County Judge' },
        share_token: 'test-token-123',
        share_token_revoked: false
      }
    ])
    .select();
  console.log('Inserted:', data, error);
}
run();
