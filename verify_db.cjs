require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('intake_submissions')
    .select('*')
    .eq('intake_id', 'intake-waylon-rogers');
    
  console.log('Submissions in DB:', data.length);
  if (data.length > 0) {
    console.log('First submission payload keys:', Object.keys(data[0].payload));
    console.log('Photos count:', data[0].payload.photos.length);
  }
}
run();
