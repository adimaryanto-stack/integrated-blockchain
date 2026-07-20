$url = "https://github.com/PostgREST/postgrest/releases/download/v12.2.0/postgrest-v12.2.0-windows-x64.zip"
$zipFile = "d:\DaVinci\Web Development\integrated-blockchain\postgrest.zip"
$destDir = "d:\DaVinci\Web Development\integrated-blockchain\postgrest"

if (-not (Test-Path $destDir)) {
    New-Item -Path $destDir -ItemType Directory -Force
}

if (-not (Test-Path "$destDir\postgrest.exe")) {
    Write-Host "Downloading PostgREST..."
    Invoke-WebRequest -Uri $url -OutFile $zipFile
    
    Write-Host "Extracting PostgREST..."
    Expand-Archive -Path $zipFile -DestinationPath $destDir -Force
    
    Remove-Item $zipFile -Force
    Write-Host "PostgREST downloaded and extracted successfully."
} else {
    Write-Host "PostgREST is already downloaded."
}
