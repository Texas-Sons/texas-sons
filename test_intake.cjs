require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('client_intakes')
    .update({ 
      business_name: 'Waylon Rogers for County Judge',
      client_contact: 'Waylon Rogers',
      category: 'Campaign & Leadership'
    })
    .eq('id', 'intake-waylon-rogers')
    .select();
}
run();
