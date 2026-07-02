<?php
$siteName = getSetting('site_name', 'CBSE Class 9 Portal');
?>
<section style="min-height:80vh;display:flex;align-items:center;justify-content:center;padding:40px 24px;position:relative;overflow:hidden;">
    <div style="position:absolute;inset:0;pointer-events:none;">
        <div style="position:absolute;top:20%;left:15%;width:120px;height:120px;border-radius:50%;background:rgba(255,15,123,0.04);filter:blur(40px);animation:float 8s ease-in-out infinite;"></div>
        <div style="position:absolute;bottom:25%;right:20%;width:160px;height:160px;border-radius:50%;background:rgba(255,15,123,0.03);filter:blur(60px);animation:float 10s ease-in-out infinite reverse;"></div>
    </div>
    <div class="text-center" style="position:relative;z-index:1;max-width:500px;" data-animate="fade-in-up">
        <div style="font-size:clamp(5rem,15vw,10rem);font-family:var(--font-display);font-weight:900;line-height:1;background:var(--accent-gradient);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;text-shadow:none;filter:drop-shadow(0 0 40px var(--accent-glow));margin-bottom:16px;">
            404
        </div>
        <div style="font-size:3rem;margin-bottom:16px;">🔍</div>
        <h1 style="font-family:var(--font-display);font-size:clamp(1.5rem,3vw,2rem);font-weight:700;margin-bottom:12px;">Page Not Found</h1>
        <p style="color:var(--text-secondary);font-size:1.05rem;margin-bottom:32px;max-width:400px;margin-left:auto;margin-right:auto;">
            The page you are looking for doesn't exist or has been moved. Let's get you back on track.
        </p>
        <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
            <a href="/" class="btn btn-primary btn-lg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                Back to Home
            </a>
            <a href="/books" class="btn btn-secondary btn-lg">Browse Books</a>
        </div>
        <div style="margin-top:32px;padding:20px;background:var(--bg-glass);border-radius:var(--radius-md);border:1px solid var(--border-color);">
            <p style="color:var(--text-muted);font-size:0.9rem;margin:0;">Try searching for what you need:</p>
            <div class="search-bar" style="margin:12px auto 0;max-width:400px;">
                <span class="search-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </span>
                <input type="text" placeholder="Search books..." aria-label="Search" style="font-size:0.9rem;padding:10px 14px 10px 42px;">
                <button class="search-clear" aria-label="Clear">✕</button>
                <div class="search-results"></div>
            </div>
        </div>
    </div>
</section>
