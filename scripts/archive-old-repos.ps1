# Push archive banners to hydraflow-app and hydraflow-backend before archiving on GitHub.
# Run from repo root after authenticating with GitHub (git credential manager).

$ErrorActionPreference = "Stop"
$banner = @"
> **Este repositorio ha sido archivado.**
> El código vive ahora en [hydraflow](https://github.com/JBDev23/hydraflow).

"@

$repos = @(
  @{ Name = "hydraflow-app"; Url = "https://github.com/JBDev23/hydraflow-app.git" },
  @{ Name = "hydraflow-backend"; Url = "https://github.com/JBDev23/hydraflow-backend.git" }
)

$work = Join-Path $env:TEMP "hydraflow-archive-push"
if (Test-Path $work) { Remove-Item -Recurse -Force $work }
New-Item -ItemType Directory -Path $work | Out-Null

foreach ($repo in $repos) {
  $dir = Join-Path $work $repo.Name
  Write-Host "Cloning $($repo.Name)..."
  git clone --depth 1 $repo.Url $dir
  Set-Location $dir

  $readme = Join-Path $dir "README.md"
  $content = Get-Content $readme -Raw
  if ($content -notmatch "Este repositorio ha sido archivado") {
    Set-Content -Path $readme -Value ($banner + "`n" + $content) -NoNewline
    git add README.md
    git commit -m "docs: archive repo, redirect to monorepo"
    git push origin main
    Write-Host "Pushed archive banner to $($repo.Name)"
  } else {
    Write-Host "Banner already present in $($repo.Name), skipping."
  }
}

Write-Host ""
Write-Host "Done. Archive each repo in GitHub: Settings -> General -> Danger Zone -> Archive this repository"
