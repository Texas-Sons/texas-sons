require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: subs } = await supabase.from('intake_submissions').select('*').eq('intake_id', 'intake-waylon-rogers');
  const reviewSubmission = subs[0];
  
  const { data: intake } = await supabase.from('client_intakes').select('*').eq('id', 'intake-waylon-rogers').single();
  
  const updatedData = {
    ...intake.data,
    tagline: reviewSubmission.payload.tagline,
    description: reviewSubmission.payload.description,
    hours: reviewSubmission.payload.hours,
    email: reviewSubmission.payload.email,
    phone: reviewSubmission.payload.phone,
    address: reviewSubmission.payload.address,
    logoUrl: reviewSubmission.payload.logoBase64,
  };
  
  if (reviewSubmission.payload.photos && reviewSubmission.payload.photos.length > 0) {
      updatedData.heroImage = reviewSubmission.payload.photos[0];
  }
  
  await supabase.from('client_intakes').update({ data: updatedData }).eq('id', 'intake-waylon-rogers');
  await supabase.from('intake_submissions').update({ reviewed: true }).eq('id', reviewSubmission.id);
  
  const { data: finalIntake } = await supabase.from('client_intakes').select('data').eq('id', 'intake-waylon-rogers').single();
  console.log("Successfully applied to intake! Merged Data:", finalIntake.data);
}
run();
