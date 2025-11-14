# Test eSewa Payment Flow

Write-Host "=== E-Commerce Payment Flow Test ===" -ForegroundColor Cyan

# Start backend server
Write-Host "`nStarting backend server..." -ForegroundColor Yellow
Start-Process node -ArgumentList "scripts\start-with-memory.js" -WorkingDirectory "n:\Download\PROGRAM\Draft\Ecommerce\backend" -WindowStyle Hidden

# Wait for server to start
Write-Host "Waiting for server to initialize (5 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test 1: Create Intent for eSewa
Write-Host "`n[TEST 1] Testing /api/payment/create-intent with eSewa provider" -ForegroundColor Cyan
$body1 = @{
    orderId = "test-order-001"
    amount = 5000
    provider = "esewa"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer test-token"
}

try {
    $resp1 = Invoke-WebRequest -Uri "http://localhost:5000/api/payment/create-intent" `
        -Method POST `
        -Headers $headers `
        -Body $body1 `
        -UseBasicParsing
    
    Write-Host "✓ SUCCESS - Status: $($resp1.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    $resp1.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10 | Write-Host
} catch {
    Write-Host "FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Check Khalti provider
Write-Host "`n[TEST 2] Testing /api/payment/create-intent with Khalti provider" -ForegroundColor Cyan
$body2 = @{
    orderId = "test-order-002"
    amount = 3000
    provider = "khalti"
} | ConvertTo-Json

try {
    $resp2 = Invoke-WebRequest -Uri "http://localhost:5000/api/payment/create-intent" `
        -Method POST `
        -Headers $headers `
        -Body $body2 `
        -UseBasicParsing
    
    Write-Host "✓ SUCCESS - Status: $($resp2.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    $resp2.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10 | Write-Host
} catch {
    Write-Host "FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Try Stripe (should fail)
Write-Host "`n[TEST 3] Testing /api/payment/create-intent with Stripe provider (should fail)" -ForegroundColor Cyan
$body3 = @{
    orderId = "test-order-003"
    amount = 2000
    provider = "stripe"
} | ConvertTo-Json

try {
    $resp3 = Invoke-WebRequest -Uri "http://localhost:5000/api/payment/create-intent" `
        -Method POST `
        -Headers $headers `
        -Body $body3 `
        -UseBasicParsing -ErrorAction Stop
    
    Write-Host "Response:" -ForegroundColor Yellow
    $resp3.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10 | Write-Host
} catch {
    Write-Host "EXPECTED ERROR - Stripe removed" -ForegroundColor Green
    Write-Host "Error message: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n=== Tests Complete ===" -ForegroundColor Cyan
Write-Host "Backend still running on http://localhost:5000" -ForegroundColor Yellow
