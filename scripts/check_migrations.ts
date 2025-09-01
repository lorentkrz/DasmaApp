import { createClient } from "@/lib/supabase/server";

async function checkMigrations() {
  const supabase = await createClient();
  
  // Check if migrations table exists
  const { data: tableExists } = await supabase
    .rpc('table_exists', { table_name: 'migrations' });
  
  console.log("Migrations table exists:", tableExists);
  
  if (tableExists) {
    // List all migrations
    const { data: migrations, error } = await supabase
      .from('migrations')
      .select('*')
      .order('version', { ascending: true });
    
    if (error) {
      console.error("Error fetching migrations:", error);
      return;
    }
    
    console.log("Applied migrations:", migrations);
  }
}

checkMigrations().catch(console.error);
