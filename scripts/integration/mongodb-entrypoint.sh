#!/bin/bash
set -euo pipefail
# Only used by the new, separately named integration project.
install -o mongodb -g mongodb -m 400 /run/secrets/replica-key /run/keys/replica.key
exec /usr/local/bin/docker-entrypoint.sh mongod --replSet goleveIntegrationV1 --bind_ip_all --keyFile /run/keys/replica.key --wiredTigerCacheSizeGB 0.25
