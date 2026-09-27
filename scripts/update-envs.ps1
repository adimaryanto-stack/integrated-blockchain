$files = Get-ChildItem -Path "d:\DaVinci\Web Development\integrated-blockchain\apps" -Filter ".env*" -Recurse -ErrorAction SilentlyContinue

foreach ($file in $files) {
    if ($file.Attributes -match "Directory") { continue }
    if ($file.Name.EndsWith(".example")) { continue }

    Write-Host "Updating environment file: $($file.FullName)"
    $content = Get-Content -Path $file.FullName

    $updatedContent = @()
    $hasUrl = $false

    foreach ($line in $content) {
        if ($line -match "^NEXT_PUBLIC_SUPABASE_URL=") {
            $updatedContent += "NEXT_PUBLIC_SUPABASE_URL=http://localhost:2028"
            $hasUrl = $true
        } else {
            $updatedContent += $line
        }
    }

    if (-not $hasUrl) {
        $updatedContent += "NEXT_PUBLIC_SUPABASE_URL=http://localhost:2028"
    }

    $updatedContent | Set-Content -Path $file.FullName
}

Write-Host "All environment files updated successfully."
