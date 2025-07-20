# PowerShell Console Cleanup Script
# Run this if your console gets broken after Ctrl+C

Write-Host "🔧 Cleaning up PowerShell console..." -ForegroundColor Yellow

# Reset console color and cursor
[Console]::ResetColor()
[Console]::Clear()

# Kill any remaining Node.js processes that might be hanging
Write-Host "🛑 Stopping any remaining Node.js processes..." -ForegroundColor Blue

try {
    # Find and stop Node.js processes related to our app
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        $_.ProcessName -eq "node" -and 
        ($_.CommandLine -like "*ridehive*" -or 
         $_.CommandLine -like "*server.js*" -or 
         $_.CommandLine -like "*vite*" -or 
         $_.CommandLine -like "*concurrently*")
    }
    
    if ($nodeProcesses) {
        $nodeProcesses | ForEach-Object {
            Write-Host "  Stopping process: $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor Gray
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        }
        Write-Host "✅ Cleaned up $($nodeProcesses.Count) Node.js processes" -ForegroundColor Green
    } else {
        Write-Host "✅ No hanging Node.js processes found" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Could not check for Node.js processes: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Reset PowerShell prompt
Write-Host "🔄 Resetting PowerShell environment..." -ForegroundColor Blue

# Clear any stuck input
[Console]::In.ReadToEnd() | Out-Null

# Reset the console mode
if ($IsWindows -or $PSVersionTable.PSVersion.Major -lt 6) {
    try {
        # Reset console input/output modes on Windows
        $signature = '[DllImport("kernel32.dll", SetLastError=true)] public static extern IntPtr GetStdHandle(int nStdHandle); [DllImport("kernel32.dll", SetLastError=true)] public static extern bool SetConsoleMode(IntPtr hConsoleHandle, uint dwMode);'
        $type = Add-Type -MemberDefinition $signature -Name ConsoleUtils -Namespace Win32 -PassThru
        $handle = $type::GetStdHandle(-10) # STD_INPUT_HANDLE
        $type::SetConsoleMode($handle, 0x1F7) # Default input mode
    } catch {
        # Silently ignore if we can't reset console mode
    }
}

Write-Host ""
Write-Host "✅ Console cleanup complete!" -ForegroundColor Green
Write-Host "💡 Your PowerShell console should now be working normally." -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Quick commands:" -ForegroundColor Blue
Write-Host "  npm run dev:status    - Check if services are running" -ForegroundColor Gray  
Write-Host "  npm run dev:deps:stop - Stop Docker dependencies" -ForegroundColor Gray
Write-Host "  npm run dev:full      - Start full development environment" -ForegroundColor Gray
Write-Host ""