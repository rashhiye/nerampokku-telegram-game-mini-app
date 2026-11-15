# ==============================================================================
# NERAMPOKKU - TELEGRAM WEBHOOK SETUP SCRIPT
# ==============================================================================

Write-Host "NERAMPOKKU: Reading configuration from .env..." -ForegroundColor Cyan

if (-not (Test-Path ".env")) {
    Write-Host "Error: .env file not found in current directory!" -ForegroundColor Red
    exit 1
}

$envVars = @{}
Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$') {
        $key = $matches[1]
        $val = $matches[2].Trim('"', "'", " ")
        $envVars[$key] = $val
    }
}

$token = $envVars["TELEGRAM_BOT_TOKEN"]
$secret = $envVars["TELEGRAM_WEBHOOK_SECRET"]
$supabase = $envVars["VITE_SUPABASE_URL"]

if (-not $token -or $token -eq "your-telegram-bot-token") {
    Write-Host "Error: TELEGRAM_BOT_TOKEN is missing or is placeholder in .env!" -ForegroundColor Red
    exit 1
}

# Auto-clean token: if user included "bot" prefix, remove it because URL adds "bot"
if ($token.StartsWith("bot")) {
    $token = $token.Substring(3)
    Write-Host "Cleaned token: stripped leading 'bot' prefix." -ForegroundColor Yellow
}

# Remove any angle brackets if accidentally pasted with <...>
$token = $token.Trim("<", ">", " ")

$cleanUrl = $supabase.TrimEnd('/')
$webhookUrl = "$cleanUrl/functions/v1/telegram-bot"

Write-Host "Testing token with Telegram getMe..." -ForegroundColor Cyan
$testUrl = "https://api.telegram.org/bot$token/getMe"

try {
    $botInfo = Invoke-RestMethod -Uri $testUrl -Method Get -TimeoutSec 10
    if ($botInfo.ok) {
        Write-Host "Bot Verified: @$($botInfo.result.username) ($($botInfo.result.first_name))" -ForegroundColor Green
    }
} catch {
    Write-Host "Telegram rejected token:" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    } else {
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
    Write-Host "`nPlease verify your token in @BotFather:" -ForegroundColor Yellow
    Write-Host "1. In Telegram, open @BotFather"
    Write-Host "2. Send /mybots -> Choose your bot -> API Token"
    Write-Host "3. Paste the exact token into .env for TELEGRAM_BOT_TOKEN"
    exit 1
}

Write-Host "`nRegistering Webhook to: $webhookUrl" -ForegroundColor Cyan
$setWebhookUrl = "https://api.telegram.org/bot$token/setWebhook"

$body = @{
    url = $webhookUrl
}
if ($secret) {
    $body["secret_token"] = $secret
}

try {
    $result = Invoke-RestMethod -Uri $setWebhookUrl `
        -Method Post `
        -ContentType "application/json" `
        -Body ($body | ConvertTo-Json) `
        -TimeoutSec 10

    if ($result.ok) {
        Write-Host "`nSUCCESS! Telegram Webhook is active!" -ForegroundColor Green
        Write-Host "Description: $($result.description)" -ForegroundColor Green
        Write-Host "`nYou can now go to your Telegram bot or group and test /start and /games!" -ForegroundColor Green
    } else {
        Write-Host "Telegram returned: $($result.description)" -ForegroundColor Red
    }
} catch {
    Write-Host "Failed to set webhook:" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    } else {
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}
