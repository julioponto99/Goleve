[CmdletBinding(SupportsShouldProcess)]
param(
    [string]$ContainerName = 'goleve-mongodb-1',
    [string]$OutputDirectory = (Join-Path $PSScriptRoot '..\..\..\session-artifacts\mongo-inventory')
)

$ErrorActionPreference = 'Stop'

function Invoke-MongoShell {
    param([string]$JavaScript)

    $args = @('exec', $ContainerName, 'mongosh', '--quiet', '--eval', $JavaScript)
    if ($env:MONGO_USERNAME) {
        $args += @('--username', $env:MONGO_USERNAME)
    }
    if ($env:MONGO_PASSWORD) {
        $authenticationDatabase = $env:MONGO_AUTH_DATABASE
        if (-not $authenticationDatabase) {
            $authenticationDatabase = 'admin'
        }
        $args += @('--password', $env:MONGO_PASSWORD, '--authenticationDatabase', $authenticationDatabase)
    }
    & docker @args
    if ($LASTEXITCODE -ne 0) {
        throw "mongosh failed with exit code $LASTEXITCODE"
    }
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'docker is required'
}

if (-not [System.IO.Path]::IsPathRooted($OutputDirectory)) {
    throw 'OutputDirectory must be an absolute protected path outside the repository'
}
if (-not $PSCmdlet.ShouldProcess($OutputDirectory, 'Write MongoDB metadata inventory')) {
    Write-Output "WhatIf: inventory would be written under $OutputDirectory"
    return
}
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$outputPath = Join-Path $OutputDirectory "inventory-$timestamp.json"

$script = @'
const admin = db.getSiblingDB("admin");
const result = {
  generatedAtUtc: new Date().toISOString(),
  server: db.runCommand({ buildInfo: 1 }),
  databases: []
};
admin.runCommand({ listDatabases: 1, nameOnly: true }).databases.forEach((entry) => {
  const database = db.getSiblingDB(entry.name);
  const collections = database.getCollectionNames().sort().map((name) => {
    const collection = database.getCollection(name);
    return {
      name,
      count: collection.estimatedDocumentCount(),
      indexes: collection.getIndexes().map((index) => ({
        name: index.name,
        key: index.key,
        unique: Boolean(index.unique),
        sparse: Boolean(index.sparse),
        expireAfterSeconds: index.expireAfterSeconds
      }))
    };
  });
  result.databases.push({ name: entry.name, collections });
});
print(JSON.stringify(result));
'@

$json = Invoke-MongoShell -JavaScript $script | Select-Object -Last 1
try {
    $parsed = $json | ConvertFrom-Json
} catch {
    throw 'mongosh output was not valid JSON; no inventory was written'
}

$parsed | ConvertTo-Json -Depth 20 | Set-Content -Path $outputPath -Encoding utf8
Write-Output "Inventory prepared at $outputPath"
