$port = 8080
$path = Split-Path -Parent $MyInvocation.MyCommand.Path

# Tạo HTTP listener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "Server đang chạy tại http://localhost:$port/"
Write-Host "Nhấn Ctrl+C để dừng"

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $localPath = $request.Url.LocalPath
        if ($localPath -eq "/") { $localPath = "/app.html" }

        $filePath = Join-Path $path $localPath.TrimStart("/")

        if (Test-Path $filePath -PathType Leaf) {
            $content = Get-Content $filePath -Raw -Encoding UTF8
            $response.ContentType = if ($filePath.EndsWith(".html")) { "text/html; charset=utf-8" } elseif ($filePath.EndsWith(".json")) { "application/json; charset=utf-8" } else { "text/plain; charset=utf-8" }
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($content)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        } else {
            $response.StatusCode = 404
            $notFound = "File not found: $localPath"
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($notFound)
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }

        $response.OutputStream.Close()
    }
} finally {
    $listener.Stop()
}