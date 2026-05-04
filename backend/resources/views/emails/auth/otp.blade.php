<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Authentication Code</title>
<style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@700&display=swap');
    
    body {
        margin: 0;
        padding: 0;
        background-color: #0c0c0c;
        color: #ebebeb;
        font-family: 'Space Grotesk', sans-serif;
    }
    
    .container {
        width: 100%;
        max-width: 500px;
        margin: 40px auto;
        background-color: #121212;
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 16px;
        overflow: hidden;
    }

    .header {
        background-color: #1a1a1a;
        padding: 30px 40px;
        text-align: center;
        border-bottom: 1px solid rgba(255,255,255,0.04);
    }

    .logo {
        width: 48px;
        height: 48px;
        background-color: #ccff00;
        border-radius: 12px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto;
        font-size: 24px;
        font-weight: bold;
        color: #000;
        box-shadow: 0 0 20px rgba(204,255,0,0.3);
    }

    .title {
        font-size: 22px;
        font-weight: 700;
        margin-top: 20px;
        margin-bottom: 0;
        color: #ffffff;
    }

    .content {
        padding: 40px;
        text-align: center;
    }

    .instruction {
        font-size: 15px;
        color: rgba(235,235,235,0.6);
        line-height: 1.6;
        margin-bottom: 30px;
    }

    .otp-box {
        background-color: rgba(204,255,0,0.05);
        border: 1px solid rgba(204,255,0,0.3);
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 30px;
    }

    .otp-code {
        font-family: 'JetBrains Mono', monospace;
        font-size: 36px;
        font-weight: 700;
        letter-spacing: 8px;
        color: #ccff00;
        margin: 0;
        display: block;
    }

    .warning {
        font-size: 13px;
        color: rgba(235,235,235,0.4);
        line-height: 1.5;
    }

    .footer {
        text-align: center;
        padding: 24px;
        background-color: #0a0a0a;
        border-top: 1px solid rgba(255,255,255,0.04);
        font-size: 12px;
        color: rgba(235,235,235,0.3);
    }

    .highlight {
        color: #ccff00;
        font-weight: 600;
    }
</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div style="text-align: center;">
                <div class="logo">A</div>
            </div>
            <h1 class="title">Verify Your Access</h1>
        </div>
        
        <div class="content">
            <p class="instruction">
                You've initiated an action that requires confirmation. Please enter the following authorization code to proceed to the <span class="highlight">ApexNova</span> arena.
            </p>
            
            <div class="otp-box">
                <span class="otp-code">{{ $otp }}</span>
            </div>
            
            <p class="warning">
                This code is valid for 10 minutes. If you did not request this verification, please safely ignore this email. Your account remains secure.
            </p>
        </div>
        
        <div class="footer">
            &copy; {{ date('Y') }} ApexNova. All rights reserved.
        </div>
    </div>
</body>
</html>
