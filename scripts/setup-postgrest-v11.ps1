$url = "https://github.com/PostgREST/postgrest/releases/download/v11.2.2/postgrest-v11.2.2-windows-x64.zip"
$zipFile = "d:\DaVinci\Web Development\integrated-blockchain\postgrest_v11.zip"
$destDir = "d:\DaVinci\Web Development\integrated-blockchain\postgrest_v11"

if (-not (Test-Path $destDir)) {
    New-Item -Path $destDir -ItemType Directory -Force
}

Write-Host "Downloading PostgREST v11..."
Invoke-WebRequest -Uri $url -OutFile $zipFile

Write-Host "Extracting PostgREST v11..."
Expand-Archive -Path $zipFile -DestinationPath $destDir -Force

Remove-Item $zipFile -Force
Write-Host "PostgREST v11 downloaded and extracted."
