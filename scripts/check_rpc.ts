import { createClient } from "@/lib/supabase/server";

async function checkRpcFunction() {
  const supabase = await createClient();
  
  // Check if the function exists by trying to call it with a test token
  const { data, error } = await supabase.rpc("get_invitation_and_party", {
    p_token: "test"
  });

  if (error) {
    if (error.code === '42883') { // Undefined function error
      console.error("The RPC function 'get_invitation_and_party' does not exist in the database.");
      console.error("Please run the migration script: scripts/014_invitation_group_public_api.sql");
    } else {
      console.error("Error calling RPC function:", error);
    }
  } else {
    console.log("RPC function exists and returned:", data);
  }
}

checkRpcFunction().catch(console.error);
