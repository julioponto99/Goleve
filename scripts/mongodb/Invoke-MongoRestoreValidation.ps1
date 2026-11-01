[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$BackupDirectory,
    [ValidateSet('goleve-mongodb-restore-test')]
    [string]$ProjectName = 'goleve-mongodb-restore-test',
    [ValidateSet('goleve-mongodb-restore-test-mongodb-restore-test-1')]
    [string]$ContainerName = 'goleve-mongodb-restore-test-mongodb-restore-test-1',
    [string]$InventoryPath
)

$ErrorActionPreference = 'Stop'
$archive = Join-Path $BackupDirectory 'mongodb.archive.gz'
$hashFile = Join-Path $BackupDirectory 'mongodb.archive.gz.sha256'

if (-not [System.IO.Path]::IsPathRooted($BackupDirectory)) {
    throw 'BackupDirectory must be an absolute protected path'
}
if ($BackupDirectory -match 'goleve_mongo_data|compose\.yaml|compose\.demo\.yaml') {
    throw 'BackupDirectory points at a protected project resource'
}
if (-not (Test-Path $archive) -or -not (Test-Path $hashFile)) {
    throw 'Archive and SHA-256 manifest are required'
}

$expected = (Get-Content $hashFile | ConvertFrom-Json).Hash
$actual = (Get-FileHash -Path $archive -Algorithm SHA256).Hash
if ($actual -ne $expected) {
    throw 'Backup SHA-256 does not match the recorded hash'
}
if ($InventoryPath) {
    if (-not [System.IO.Path]::IsPathRooted($InventoryPath) -or -not (Test-Path $InventoryPath)) {
        throw 'InventoryPath must be an existing absolute path'
    }
    $null = Get-Content -Raw -Path $InventoryPath | ConvertFrom-Json
}

Write-Warning 'This script is preparation only. Restore requires explicit approval.'
Write-Output "Verified archive hash: $actual"
Write-Output "Proposed restore project: $ProjectName"
Write-Output "Proposed container: $ContainerName"
Write-Output 'Proposed commands, not executed:'
Write-Output "docker compose -f compose.mongodb-restore-test.yaml -p $ProjectName up -d"
Write-Output "docker cp `"$archive`" ${ContainerName}:/tmp/mongodb.archive.gz"
Write-Output "docker exec $ContainerName mongorestore --archive=/tmp/mongodb.archive.gz --gzip"
Write-Output "docker compose -f compose.mongodb-restore-test.yaml -p $ProjectName ps"
Write-Output 'After restore, compare the inventory counts and indexes; this script does not connect to MongoDB or run mongorestore.'
