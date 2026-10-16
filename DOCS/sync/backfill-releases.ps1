<#Requires -Version 5.1
<#
.SYNOPSIS
  Kirim ulang semua berkas rilis (releases/*.json) ke API portfolio.
.DESCRIPTION
  Tiap berkas menjadi satu kegiatan (source = nama berkas) sehingga revisi
  berikutnya menimpa baris yang sama, bukan mendobel.
.PARAMETER ReleasesDir
  Folder berisi berkas rilis. Default: .\releases
.PARAMETER ProjectKey
  Kunci X-project WAJIB (minta ke pemilik portfolio).
.PARAMETER ProjectName
  Nama tampil proyek. Default: Kominfo Super Aman.
.PARAMETER ApiUrl
  URL API portfolio. Default: https://ajoroby.is-a.dev/api/activities
.PARAMETER DryRun
  Hanya tampilkan yang akan dikirim, tanpa POST.
.EXAMPLE
  .\backfill-releases.ps1 -ProjectKey "pk_xxx"
  .\backfill-releases.ps1 -ProjectKey "pk_xxx" -ReleasesDir "E:\app\releases" -DryRun
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$ProjectKey,
    [string]$ReleasesDir = ".\releases",
    [string]$ProjectName = "Kominfo Super Aman",
    [string]$ApiUrl = "https://ajoroby.is-a.dev/api/activities",
    [switch]$DryRun
)

$kindMap = @{ feature = "feature"; fix = "fix"; important = "feature"; improvement = "update" }

function Truncate([string]$s, [int]$max) {
    if ([string]::IsNullOrEmpty($s)) { return "" }
    if ($s.Length -le $max) { return $s }
    return $s.Substring(0, $max)
}

$files = Get-ChildItem -Path $ReleasesDir -Filter "*.json" | Sort-Object Name
if ($files.Count -eq 0) { Write-Warning "Tidak ada *.json di $ReleasesDir"; exit 1 }

$sent = 0; $failed = 0
foreach ($f in $files) {
    try {
        $r = Get-Content $f.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
    } catch {
        Write-Warning "SKIP $($f.Name): bukan JSON valid"
        $failed++; continue
    }
    $kind = $kindMap[$r.type]
    if (-not $kind) { $kind = "update" }
    $titleId = Truncate ([string]$r.title.id) 300
    $titleEn = Truncate ([string]$r.title.en) 300
    if ([string]::IsNullOrWhiteSpace($titleId) -or [string]::IsNullOrWhiteSpace($titleEn)) {
        Write-Warning "SKIP $($f.Name): title id/en kosong"
        $failed++; continue
    }
    $bodyId = Truncate ([string]$r.body.id) 2000
    $bodyEn = Truncate ([string]$r.body.en) 2000
    if ([string]::IsNullOrWhiteSpace($bodyId) -and $r.items) {
        $joinedId = (($r.items | ForEach-Object { $_.id }) -join " ") 
        $joinedEn = (($r.items | ForEach-Object { $_.en }) -join " ")
        if ([string]::IsNullOrWhiteSpace($bodyId)) { $bodyId = Truncate $joinedId 2000 }
        if ([string]::IsNullOrWhiteSpace($bodyEn)) { $bodyEn = Truncate $joinedEn 2000 }
    }
    $payload = @{
        kind    = $kind
        project = @{ name = $ProjectName }
        source  = $f.Name
        title   = @{ id = $titleId; en = $titleEn }
        body    = @{ id = $bodyId; en = $bodyEn }
    } | ConvertTo-Json -Depth 5 -Compress

    if ($DryRun) {
        Write-Host "DRY $($f.Name) -> kind=$kind title=$titleId"
        continue
    }
    try {
        $res = Invoke-RestMethod -Method Post -Uri $ApiUrl -ContentType "application/json" `
            -Headers @{ "X-project" = $ProjectKey } -Body ([System.Text.Encoding]::UTF8.GetBytes($payload))
        Write-Host "OK $($f.Name) -> id=$($res.id) updated=$($res.updated)"
        $sent++
        Start-Sleep -Milliseconds 300
    } catch {
        Write-Warning "FAIL $($f.Name): $($_.Exception.Message)"
        $failed++
    }
}
Write-Host "Selesai: terkirim=$sent gagal=$failed dari=$($files.Count)"
