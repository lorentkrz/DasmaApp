$supabaseUrl = "https://gemprahrazgnfidlomwlh.supabase.co"
$supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlbXBwaHJhemduZmlkbG9td2xoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjcyMDQxMCwiZXhwIjoyMDcyMjk2NDEwfQ.Liu9TDLY3aiz92Ae2LJKma3km8J_FnpDgKjvck44NbE"

$headers = @{
    "apikey" = $supabaseKey
    "Authorization" = "Bearer $supabaseKey"
    "Content-Type" = "application/json"
}

# Get all SQL files in order
$sqlFiles = Get-ChildItem -Path $PSScriptRoot\0*.sql | Sort-Object Name

foreach ($file in $sqlFiles) {
    Write-Host "Running migration: $($file.Name)"
    $sqlContent = Get-Content -Path $file.FullName -Raw
    
    $body = @{
        query = $sqlContent
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/rpc/execute_sql" \
            -Method Post \
            -Headers $headers \
            -Body $body
        Write-Host "✅ Successfully executed: $($file.Name)" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Error executing $($file.Name):" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host "\nAll migrations completed!"
