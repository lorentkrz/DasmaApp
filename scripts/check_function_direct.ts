import { createClient } from "@/lib/supabase/server";

async function checkFunctionExists() {
  const supabase = await createClient();
  
  // Query the pg_proc catalog to check if the function exists
  const { data, error } = await supabase
    .from('pg_proc')
    .select('proname')
    .eq('proname', 'get_invitation_and_party')
    .single();

  if (error) {
    console.error("Error querying pg_proc:", error);
    return;
  }
  
  if (data) {
    console.log("✅ RPC function exists:", data.proname);
  } else {
    console.log("❌ RPC function does not exist");
  }
}

checkFunctionExists().catch(console.error);
