Set-Location -LiteralPath $PSScriptRoot
$taskNode = Get-Command node -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1
if (-not $taskNode) {
  $taskNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
  if (-not (Test-Path -LiteralPath $taskNode)) { throw 'Node.js 20 eller senare behövs.' }
}
& $taskNode scripts/build.mjs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& $taskNode scripts/serve.mjs
