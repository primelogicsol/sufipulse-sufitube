Copy-Item .phase2/reconciled-cms-releases.json .data/cms-releases.json -Force
Copy-Item .phase2/reconciled-cms-releases.json .next/standalone/.data/cms-releases.json -Force

$env:PORT="3005"
$env:RELEASE_STORAGE_BACKEND="postgres"
$env:DATABASE_URL="postgres://postgres:pass@localhost:5434/sufipulse_phase2"

$proc1 = Start-Process npm -ArgumentList "run dev" -PassThru
Start-Sleep -Seconds 10
node scripts/phase2-http-snapshot-gen.mjs
Stop-Process -Id $proc1.Id -Force

Copy-Item .phase2/reconciled-cms-releases.json .data/cms-releases.json -Force
Copy-Item .phase2/reconciled-cms-releases.json .next/standalone/.data/cms-releases.json -Force

$env:RELEASE_STORAGE_BACKEND="filesystem"
$proc2 = Start-Process npm -ArgumentList "run dev" -PassThru
Start-Sleep -Seconds 10
node scripts/phase2-http-snapshot-gen.mjs
Stop-Process -Id $proc2.Id -Force

node scripts/phase2-http-read-parity.mjs
