$psql = "d:\DaVinci\Web Development\integrated-blockchain\pgsql\bin\psql.exe"
$dbUrl = "postgresql://postgres@localhost:2027/postgres"

Write-Host "=== Setting up Database Prerequisites ==="
$prereqs = @'
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY,
    email TEXT
);

CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
    SELECT null::uuid;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION auth.jwt() RETURNS JSONB AS $$
    SELECT '{}'::jsonb;
$$ LANGUAGE SQL STABLE;

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "moddatetime" SCHEMA extensions;

-- Try creating publication, catch if already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END
$$;
'@

$prereqs | & $psql -d $dbUrl -e

Write-Host "=== Applying Migrations in Order ==="
$migrationsDir = "d:\DaVinci\Web Development\integrated-blockchain\apps\transparansi-anggaran\supabase\migrations"
$migrationFiles = Get-ChildItem -Path $migrationsDir -Filter "*.sql" | Sort-Object Name

foreach ($file in $migrationFiles) {
    Write-Host "Applying migration: $($file.Name)"
    & $psql -d $dbUrl -f $file.FullName -e
}

Write-Host "=== Applying Supabase Schema ==="
$schemaFile = "d:\DaVinci\Web Development\integrated-blockchain\apps\transparansi-anggaran\supabase_schema.sql"
if (Test-Path $schemaFile) {
    Write-Host "Applying: $schemaFile"
    & $psql -d $dbUrl -f $schemaFile -e
} else {
    Write-Warning "Schema file not found at $schemaFile"
}

Write-Host "=== Database Setup Completed ==="
