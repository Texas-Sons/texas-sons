import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('projects').select('blueprint').eq('id', 'prj_trevino_sheriff').single();
  if (error) {
    console.error(error);
    return;
  }
  
  let bp = data.blueprint;
  
  // Update Profile
  bp.profile.tagline = "Honest Leadership. Safer Communities. Stronger Atascosa County.";
  bp.profile.description = "With 28 years of law enforcement experience, Ernest Trevino is committed to protecting and serving every citizen of Atascosa County with integrity, fairness, professionalism, and respect.";
  bp.profile.email = "trevinofortransparency@yahoo.com";
  
  // Update Badges
  bp.badges = [
    "28+ Years Texas Law Enforcement",
    "Medal of Valor Recipient",
    "Master Peace Officer",
    "Lifelong Atascosa County Resident"
  ];
  bp.proofBadgeText = "Official 2026 Endorsements · Law Enforcement Verified";

  // Update Services / Pillars
  bp.services = [
    {
      title: "Priority #1: Protect Our Kids",
      description: "Ensure all county officers are cross-trained and ready for active shooters in schools or any location. We will work to protect the future of our children and generations to come.",
      duration: "Pillar #1",
      highlight: true
    },
    {
      title: "Proactive Enforcement & Transparency",
      description: "Modernizing law-enforcement practices and fostering interagency cooperation. Rejecting favoritism to ensure equal treatment and open, transparent government for everyone.",
      duration: "Pillar #2"
    },
    {
      title: "Stronger Community Partnerships",
      description: "Restoring and strengthening trust between the Sheriff's Office and the communities we serve. Serving fairly, leading honestly, and protecting everyone.",
      duration: "Pillar #3"
    }
  ];

  // Update Testimonials / Accomplishments
  bp.testimonials = [
    {
      quote: "Assisted in the 'Atascosa Ambush' and received the SAPD Medal of Valor, Texas Governor's Medal of Valor, and DPS Director's Award.",
      author: "Medal of Valor Recipient",
      role: "State of Texas Recognition",
      rating: 5,
      verified: true
    },
    {
      quote: "Served as a ROP Detective involved in 165 high-risk felony search warrants. Joint work with federal agencies contributed to 1,473 felony suspect arrests.",
      author: "Undercover ROP Detective",
      role: "2001-2005",
      rating: 5,
      verified: true
    },
    {
      quote: "Supervised over 3,200 sworn officers and managed a $150 million budget environment for the San Antonio Police Department.",
      author: "Patrol Division Command",
      role: "SAPD Supervisor (2010-2015)",
      rating: 5,
      verified: true
    }
  ];

  const { error: updateError } = await supabase.from('projects').update({ blueprint: bp }).eq('id', 'prj_trevino_sheriff');
  if (updateError) {
    console.error("Update failed", updateError);
  } else {
    console.log("Updated successfully!");
  }
}

run();
