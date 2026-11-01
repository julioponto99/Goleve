[CmdletBinding(SupportsShouldProcess)]
param(
    [string]$ContainerName = 'goleve-mongodb-1',
    [string]$BackupRoot = (Join-Path $PSScriptRoot '..\..\..\protected-backups\mongodb'),
    [int]$MinimumFreeSpaceGb = 5
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'docker is required'
}
if (-not $env:MONGO_BACKUP_URI) {
    throw 'MONGO_BACKUP_URI must be provided through a protected environment mechanism'
}

$resolvedRoot = [System.IO.Path]::GetFullPath($BackupRoot)
if (-not [System.IO.Path]::IsPathRooted($BackupRoot)) {
    throw 'BackupRoot must be an absolute protected path outside the repository'
}
$rootItem = Get-Item -LiteralPath (Split-Path -Parent $resolvedRoot) -ErrorAction SilentlyContinue
if (-not $rootItem) {
    if (-not $PSCmdlet.ShouldProcess($resolvedRoot, 'Create protected backup root')) {
        Write-Output "WhatIf: backup root would be created at $resolvedRoot"
        return
    }
    New-Item -ItemType Directory -Path $resolvedRoot -Force | Out-Null
    $rootItem = Get-Item -LiteralPath $resolvedRoot
}
if (-not $WhatIfPreference) {
    $drive = Get-PSDrive -Name $rootItem.PSDrive.Name -ErrorAction Stop
    if (($drive.Free / 1GB) -lt $MinimumFreeSpaceGb) {
        throw "Insufficient free space on $($drive.Name): at least $MinimumFreeSpaceGb GB required"
    }
}

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$destination = Join-Path $resolvedRoot "backup-$timestamp"
$archive = Join-Path $destination 'mongodb.archive.gz'
$manifest = Join-Path $destination 'manifest.json'
$hashFile = Join-Path $destination 'mongodb.archive.gz.sha256'

if (Test-Path $destination) {
    throw "Backup destination already exists: $destination"
}
if (-not $PSCmdlet.ShouldProcess($destination, 'Create backup directory')) {
    Write-Output "WhatIf: backup directory would be created at $destination"
    return
}
New-Item -ItemType Directory -Path $destination | Out-Null

try {
    $metadata = @{
        createdAtUtc = (Get-Date).ToUniversalTime().ToString('o')
        container = $ContainerName
        archive = 'mongodb.archive.gz'
        consistency = 'Requires approved write-quiescence window; mongodump is not a cross-database atomic snapshot'
        sourceUri = 'redacted'
    }
    $metadata | ConvertTo-Json | Set-Content -Path $manifest -Encoding utf8

    if ($PSCmdlet.ShouldProcess($destination, 'Create compressed mongodump archive')) {
        $env:MONGO_BACKUP_URI | & docker exec -i $ContainerName `
            sh -c 'read -r MONGO_BACKUP_URI; exec mongodump --uri "$MONGO_BACKUP_URI" --archive --gzip' > $archive
        if ($LASTEXITCODE -ne 0) {
            throw "mongodump failed with exit code $LASTEXITCODE"
        }
        if ((Get-Item $archive).Length -eq 0) {
            throw 'mongodump produced an empty archive'
        }
        Get-FileHash -Path $archive -Algorithm SHA256 |
            Select-Object Algorithm, Hash, Path |
            ConvertTo-Json | Set-Content -Path $hashFile -Encoding utf8
    } else {
        Write-Output "WhatIf: backup would be written to $archive"
    }
} catch {
    if (Test-Path $destination) {
        Add-Content -Path (Join-Path $destination 'FAILED.txt') -Value $_.Exception.Message
    }
    throw
}

Write-Output "Backup prepared at $destination"
