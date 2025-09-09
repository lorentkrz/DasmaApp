import { createClient } from "@/lib/supabase/server";
import fs from 'fs';
import path from 'path';

async function verifyAndFixRpc() {
  const supabase = await createClient();

  // Check if the function exists
  const { data: functionExists } = await supabase.rpc('pg_get_functiondef', {
    p_oid: 'public.get_invitation_and_party::regprocedure'
  }).single();

  if (!functionExists) {
    console.log("RPC function not found. Creating it now...");

    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'scripts', '014_invitation_group_public_api.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    const { error } = await supabase.rpc('execute_sql', {
      query: sql
    });

    if (error) {
      console.error("Failed to create RPC function:", error);
      return;
    }

    console.log("RPC function created successfully!");
  } else {
    console.log("RPC function already exists.");
  }

  // Test the function
  console.log("Testing RPC function...");
  const { data, error } = await supabase.rpc("get_invitation_and_party", {
    p_token: "test"
  });

  if (error) {
    console.error("Error testing RPC function:", error);
  } else {
    console.log("RPC function test result:", data);
  }
}

verifyAndFixRpc().catch(console.error);
