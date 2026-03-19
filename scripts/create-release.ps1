# Script PowerShell pour créer une nouvelle release

param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

# Vérifier le format de la version
if ($Version -notmatch '^\d+\.\d+\.\d+$') {
    Write-Host "❌ Format de version invalide. Utilisez le format: X.Y.Z (ex: 1.2.0)" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Création de la release v$Version" -ForegroundColor Cyan

# 1. Mettre à jour package.json
Write-Host "`n📝 Mise à jour de package.json..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$packageJson.version = $Version
$packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"

# 2. Mettre à jour installer-ui/package.json
Write-Host "📝 Mise à jour de installer-ui/package.json..." -ForegroundColor Yellow
$installerPackageJson = Get-Content "installer-ui/package.json" -Raw | ConvertFrom-Json
$installerPackageJson.version = $Version
$installerPackageJson | ConvertTo-Json -Depth 10 | Set-Content "installer-ui/package.json"

# 3. Commit des changements
Write-Host "`n💾 Commit des changements..." -ForegroundColor Yellow
git add package.json installer-ui/package.json
git commit -m "Release v$Version"

# 4. Créer le tag
Write-Host "`n🏷️  Création du tag v$Version..." -ForegroundColor Yellow
git tag "v$Version"

# 5. Push
Write-Host "`n⬆️  Push vers GitHub..." -ForegroundColor Yellow
git push origin main
git push origin "v$Version"

Write-Host "`n✅ Release v$Version créée avec succès!" -ForegroundColor Green
Write-Host "📦 Le workflow GitHub Actions va maintenant builder et publier la release." -ForegroundColor Cyan
Write-Host "🔗 Vérifiez l'avancement sur: https://github.com/natouxav1/nexus-launcherc/actions" -ForegroundColor Cyan
