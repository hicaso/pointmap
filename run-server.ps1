# Get the directory where this script is located
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:8086/")

try {
    $listener.Start()
    Write-Host "Point Map Server started on http://127.0.0.1:8086"
    Start-Process "http://127.0.0.1:8086"
} catch {
    Write-Error "Failed to start listener: $_"
    exit
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        # Add CORS Headers for local development
        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.Headers.Add("Access-Control-Allow-Headers", "*")
        $response.Headers.Add("Access-Control-Allow-Methods", "*")
        
        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.Close()
            continue
        }
        
        $urlPath = $request.Url.LocalPath
        
        if ($urlPath -eq "/api/directions") {
            $queryString = $request.Url.Query
            $targetUrl = "https://maps.googleapis.com/maps/api/directions/json" + $queryString
            
            try {
                $proxyResponse = Invoke-WebRequest -Uri $targetUrl -Method Get -UseBasicParsing -TimeoutSec 10
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($proxyResponse.Content)
                
                $response.Headers.Add("Access-Control-Allow-Origin", "*")
                $response.Headers.Add("Access-Control-Allow-Headers", "*")
                $response.Headers.Add("Access-Control-Allow-Methods", "*")
                $response.ContentType = "application/json; charset=utf-8"
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } catch {
                $response.StatusCode = 500
                $msg = [System.Text.Encoding]::UTF8.GetBytes("Error proxying request: $_")
                $response.ContentLength64 = $msg.Length
                $response.OutputStream.Write($msg, 0, $msg.Length)
            }
            $response.Close()
            continue
        }
        
        if ($urlPath -eq "/api/check-user") {
            $response.ContentType = "application/json; charset=utf-8"
            $userId = $request.QueryString["userId"]
            if ([string]::IsNullOrEmpty($userId)) {
                $response.StatusCode = 400
                $responseBody = @{ success = $false; exists = $false; message = "userId가 누락되었습니다." } | ConvertTo-Json
            } else {
                $safeUserId = [regex]::Replace($userId, "[^a-zA-Z0-9_\-]", "")
                $userFilePath = Join-Path $ScriptDir "data\$safeUserId.json"
                $exists = Test-Path $userFilePath -PathType Leaf
                $responseBody = @{ success = $true; exists = $exists } | ConvertTo-Json
            }
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($responseBody)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        if ($urlPath -eq "/api/login") {
            $response.ContentType = "application/json; charset=utf-8"
            if ($request.HasEntityBody) {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $body = $reader.ReadToEnd()
                $reader.Close()
                
                try {
                    $payload = ConvertFrom-Json $body
                    $userId = $payload.userId
                    $password = $payload.password
                    
                    if ([string]::IsNullOrEmpty($userId) -or $null -eq $password) {
                        $response.StatusCode = 400
                        $responseBody = @{ success = $false; message = "아이디와 비밀번호를 모두 입력해주세요." } | ConvertTo-Json -Depth 100
                        $bytes = [System.Text.Encoding]::UTF8.GetBytes($responseBody)
                        $response.ContentLength64 = $bytes.Length
                        $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    } else {
                        # Sanitize userId
                        $safeUserId = [regex]::Replace($userId, "[^a-zA-Z0-9_\-]", "")
                        $userFilePath = Join-Path $ScriptDir "data\$safeUserId.json"
                        
                        # Ensure data directory exists
                        $dataDir = Join-Path $ScriptDir "data"
                        if (!(Test-Path $dataDir)) {
                            New-Item -ItemType Directory -Path $dataDir | Out-Null
                        }
                        
                        if (!(Test-Path $userFilePath -PathType Leaf)) {
                            # Register new user
                            $initialData = @{
                                password = $password
                                itineraries = @{}
                            }
                            $jsonData = ConvertTo-Json $initialData -Depth 100
                            [System.IO.File]::WriteAllText($userFilePath, $jsonData, [System.Text.Encoding]::UTF8)
                            
                            $responseBody = @{
                                success = $true
                                isNew = $true
                                itineraries = @{}
                            } | ConvertTo-Json -Depth 100
                            $bytes = [System.Text.Encoding]::UTF8.GetBytes($responseBody)
                            $response.ContentLength64 = $bytes.Length
                            $response.OutputStream.Write($bytes, 0, $bytes.Length)
                        } else {
                            # Read existing user
                            $rawContent = Get-Content $userFilePath -Raw -Encoding UTF8
                            $existingJson = ConvertFrom-Json $rawContent
                            
                            if ($null -eq $existingJson.password) {
                                # Upgrade legacy format to wrapped format using current password
                                $wrappedData = @{
                                    password = $password
                                    itineraries = $existingJson
                                }
                                $jsonData = ConvertTo-Json $wrappedData -Depth 100
                                [System.IO.File]::WriteAllText($userFilePath, $jsonData, [System.Text.Encoding]::UTF8)
                                
                                $responseBody = @{
                                    success = $true
                                    isNew = $false
                                    itineraries = $existingJson
                                } | ConvertTo-Json -Depth 100
                                $bytes = [System.Text.Encoding]::UTF8.GetBytes($responseBody)
                                $response.ContentLength64 = $bytes.Length
                                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                            } else {
                                # Check password
                                if ($existingJson.password -eq $password) {
                                    $responseBody = @{
                                        success = $true
                                        isNew = $false
                                        itineraries = $existingJson.itineraries
                                    } | ConvertTo-Json -Depth 100
                                    $bytes = [System.Text.Encoding]::UTF8.GetBytes($responseBody)
                                    $response.ContentLength64 = $bytes.Length
                                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                                } else {
                                    $response.StatusCode = 401
                                    $responseBody = @{
                                        success = $false
                                        message = "비밀번호가 일치하지 않습니다."
                                    } | ConvertTo-Json -Depth 100
                                    $bytes = [System.Text.Encoding]::UTF8.GetBytes($responseBody)
                                    $response.ContentLength64 = $bytes.Length
                                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                                }
                            }
                        }
                    }
                } catch {
                    $response.StatusCode = 500
                    $responseBody = @{ success = $false; message = "서버 오류: $_" } | ConvertTo-Json -Depth 100
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes($responseBody)
                    $response.ContentLength64 = $bytes.Length
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                }
            } else {
                $response.StatusCode = 400
                $responseBody = @{ success = $false; message = "요청 본문이 비어있습니다." } | ConvertTo-Json -Depth 100
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($responseBody)
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            $response.Close()
            continue
        }
        
        if ($urlPath -eq "/api/save") {
            $userId = $request.QueryString["userId"]
            $password = $request.QueryString["password"]
            if ([string]::IsNullOrEmpty($userId)) {
                $response.StatusCode = 400
                $msg = [System.Text.Encoding]::UTF8.GetBytes("Missing userId parameter")
                $response.ContentLength64 = $msg.Length
                $response.OutputStream.Write($msg, 0, $msg.Length)
            } else {
                if ($request.HasEntityBody) {
                    $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                    $body = $reader.ReadToEnd()
                    $reader.Close()
                    
                    # Sanitize userId
                    $safeUserId = [regex]::Replace($userId, "[^a-zA-Z0-9_\-]", "")
                    $userFilePath = Join-Path $ScriptDir "data\$safeUserId.json"
                    
                    # Ensure data directory exists
                    $dataDir = Join-Path $ScriptDir "data"
                    if (!(Test-Path $dataDir)) {
                        New-Item -ItemType Directory -Path $dataDir | Out-Null
                    }
                    
                    try {
                        $passwordToSave = $password
                        # Load existing file to check password and preserve it
                        if (Test-Path $userFilePath) {
                            $rawContent = Get-Content $userFilePath -Raw -Encoding UTF8
                            $existingJson = ConvertFrom-Json $rawContent
                            if ($null -ne $existingJson.password) {
                                if ($existingJson.password -ne $password) {
                                    $response.StatusCode = 401
                                    $msg = [System.Text.Encoding]::UTF8.GetBytes("Unauthorized: Incorrect password")
                                    $response.ContentLength64 = $msg.Length
                                    $response.OutputStream.Write($msg, 0, $msg.Length)
                                    $response.Close()
                                    continue
                                }
                                $passwordToSave = $existingJson.password
                            }
                        }
                        
                        # Parse incoming itineraries
                        $newItineraries = ConvertFrom-Json $body
                        
                        # Wrap
                        $wrappedData = @{
                            password = $passwordToSave
                            itineraries = $newItineraries
                        }
                        $jsonData = ConvertTo-Json $wrappedData -Depth 100
                        [System.IO.File]::WriteAllText($userFilePath, $jsonData, [System.Text.Encoding]::UTF8)
                        
                        $response.StatusCode = 200
                        $msg = [System.Text.Encoding]::UTF8.GetBytes("Saved successfully")
                        $response.ContentLength64 = $msg.Length
                        $response.OutputStream.Write($msg, 0, $msg.Length)
                    } catch {
                        $response.StatusCode = 500
                        $msg = [System.Text.Encoding]::UTF8.GetBytes("Error writing file: $_")
                        $response.ContentLength64 = $msg.Length
                        $response.OutputStream.Write($msg, 0, $msg.Length)
                    }
                } else {
                    $response.StatusCode = 400
                    $msg = [System.Text.Encoding]::UTF8.GetBytes("Empty request body")
                    $response.ContentLength64 = $msg.Length
                    $response.OutputStream.Write($msg, 0, $msg.Length)
                }
            }
            $response.Close()
            continue
        }
        
        if ($urlPath -eq "/api/share") {
            $response.ContentType = "application/json; charset=utf-8"
            $dataDir = Join-Path $ScriptDir "data"
            if (!(Test-Path $dataDir)) {
                New-Item -ItemType Directory -Path $dataDir | Out-Null
            }
            
            if ($request.HttpMethod -eq "POST") {
                if ($request.HasEntityBody) {
                    $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                    $body = $reader.ReadToEnd()
                    $reader.Close()
                    
                    $shareId = [System.Guid]::NewGuid().ToString().Substring(0, 8)
                    $shareFilePath = Join-Path $dataDir "share_$shareId.json"
                    [System.IO.File]::WriteAllText($shareFilePath, $body, [System.Text.Encoding]::UTF8)
                    
                    $resObj = @{ success = $true; shareId = $shareId } | ConvertTo-Json -Depth 100
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes($resObj)
                    $response.ContentLength64 = $bytes.Length
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                } else {
                    $response.StatusCode = 400
                    $resObj = @{ success = $false; message = "Empty body" } | ConvertTo-Json
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes($resObj)
                    $response.ContentLength64 = $bytes.Length
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                }
            } elseif ($request.HttpMethod -eq "GET") {
                $shareId = $request.QueryString["id"]
                if ([string]::IsNullOrEmpty($shareId)) {
                    $shareId = $request.QueryString["shareId"]
                }
                
                if ([string]::IsNullOrEmpty($shareId)) {
                    $response.StatusCode = 400
                    $resObj = @{ success = $false; message = "Missing shareId parameter" } | ConvertTo-Json
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes($resObj)
                    $response.ContentLength64 = $bytes.Length
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                } else {
                    $safeShareId = [regex]::Replace($shareId, "[^a-zA-Z0-9_\-]", "")
                    $shareFilePath = Join-Path $dataDir "share_$safeShareId.json"
                    
                    if (Test-Path $shareFilePath -PathType Leaf) {
                        $bytes = [System.IO.File]::ReadAllBytes($shareFilePath)
                        $response.ContentLength64 = $bytes.Length
                        $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    } else {
                        $response.StatusCode = 404
                        $resObj = @{ success = $false; message = "Share payload not found" } | ConvertTo-Json
                        $bytes = [System.Text.Encoding]::UTF8.GetBytes($resObj)
                        $response.ContentLength64 = $bytes.Length
                        $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    }
                }
            }
            $response.Close()
            continue
        }
        
        if ($urlPath -eq "/" -or $urlPath -eq "") {
            $urlPath = "/index.html"
        }
        
        $filePath = Join-Path $ScriptDir $urlPath.TrimStart('/')
        
        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            
            # Content Type Mapping & No-Cache Headers
            $response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate")
            $response.Headers.Add("Pragma", "no-cache")
            $response.Headers.Add("Expires", "0")
            if ($filePath.EndsWith(".html")) {
                $response.ContentType = "text/html; charset=utf-8"
            } elseif ($filePath.EndsWith(".js")) {
                $response.ContentType = "application/javascript; charset=utf-8"
            } elseif ($filePath.EndsWith(".css")) {
                $response.ContentType = "text/css; charset=utf-8"
            } elseif ($filePath.EndsWith(".png")) {
                $response.ContentType = "image/png"
            } elseif ($filePath.EndsWith(".svg")) {
                $response.ContentType = "image/svg+xml"
            }
            
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($msg, 0, $msg.Length)
        }
        $response.Close()
    } catch {
        # Silent continue
    }
}
