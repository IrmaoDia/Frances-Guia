$ErrorActionPreference = 'Stop'
$siteRoot = [IO.Path]::GetFullPath($PSScriptRoot)
$listener = [Net.HttpListener]::new()
$listener.Prefixes.Add('http://localhost:8080/')
$listener.Start()
try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        try {
            $relative = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath).TrimStart('/')
            if (-not $relative) { $relative = 'index.html' }
            $filePath = [IO.Path]::GetFullPath((Join-Path $siteRoot $relative))
            if (-not $filePath.StartsWith($siteRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
                $context.Response.StatusCode = 403
            } elseif ([IO.File]::Exists($filePath)) {
                $context.Response.ContentType = switch ([IO.Path]::GetExtension($filePath)) {
                    '.html' { 'text/html; charset=utf-8' }
                    '.css' { 'text/css; charset=utf-8' }
                    '.js' { 'application/javascript; charset=utf-8' }
                    '.svg' { 'image/svg+xml' }
                    '.png' { 'image/png' }
                    '.jpg' { 'image/jpeg' }
                    '.jpeg' { 'image/jpeg' }
                    '.webp' { 'image/webp' }
                    '.mp4' { 'video/mp4' }
                    default { 'application/octet-stream' }
                }
                $bytes = [IO.File]::ReadAllBytes($filePath)
                $context.Response.ContentLength64 = $bytes.Length
                $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $context.Response.StatusCode = 404
            }
        } catch {
            $context.Response.StatusCode = 500
        } finally {
            $context.Response.Close()
        }
    }
} finally {
    $listener.Close()
}
