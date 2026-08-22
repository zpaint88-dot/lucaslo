#!/usr/bin/env python3
"""
Install Google Analytics 4 (GA4) + WhatsApp click tracking directly into HTML
files, bypassing GTM UI. Works independently of GTM (though GTM stays installed
for future use).

Usage:
    python install-ga4.py <G-XXXXXXXXXX> <repo_path>
"""
import re
import sys
from pathlib import Path

GA4_MARKER = "<!-- Google tag (gtag.js) -->"

def ga4_snippet(ga4_id: str) -> str:
    return f"""<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id={ga4_id}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());
  gtag('config', '{ga4_id}');

  // ZPAINT — WhatsApp click tracking
  document.addEventListener('DOMContentLoaded', function() {{
    document.body.addEventListener('click', function(e) {{
      var a = e.target.closest('a[href*="wa.me"]');
      if (!a) return;
      var href = a.getAttribute('href') || '';
      var phone = (href.match(/wa\\.me\\/(\\d+)/) || [])[1] || '';
      gtag('event', 'whatsapp_click', {{
        link_url: href,
        link_text: (a.innerText || '').trim().slice(0, 100),
        whatsapp_number: phone,
        page_location: window.location.href,
        page_path: window.location.pathname
      }});
    }}, true);
  }});
</script>
<!-- End Google tag -->
"""

def install(html: str, ga4_id: str) -> str:
    if GA4_MARKER in html:
        # Replace existing block
        html = re.sub(
            r"<!-- Google tag \(gtag\.js\) -->.*?<!-- End Google tag -->\s*",
            ga4_snippet(ga4_id),
            html,
            flags=re.DOTALL,
        )
        return html

    # Insert immediately after GTM head block if present, else after <head>
    if "<!-- End Google Tag Manager -->" in html:
        html = html.replace(
            "<!-- End Google Tag Manager -->\n",
            "<!-- End Google Tag Manager -->\n\n" + ga4_snippet(ga4_id),
            1,
        )
    else:
        html = re.sub(
            r"(<head[^>]*>)",
            r"\1\n" + ga4_snippet(ga4_id),
            html,
            count=1,
        )
    return html

def main():
    if len(sys.argv) < 3:
        print("Usage: python install-ga4.py <G-XXXXXXXXXX> <repo_path>")
        sys.exit(1)

    ga4_id = sys.argv[1]
    repo = Path(sys.argv[2])

    if not re.match(r"^G-[A-Z0-9]+$", ga4_id):
        print(f"Invalid GA4 ID: {ga4_id}")
        sys.exit(1)

    html_files = list(repo.glob("*.html")) + list(repo.glob("blog/*.html"))
    print(f"Found {len(html_files)} HTML files")

    changed = 0
    for f in html_files:
        original = f.read_text(encoding="utf-8")
        updated = install(original, ga4_id)
        if updated != original:
            f.write_text(updated, encoding="utf-8")
            changed += 1
            print(f"  ✓ {f.relative_to(repo)}")

    print(f"\nDone. Updated {changed} files with GA4 ID: {ga4_id}")

if __name__ == "__main__":
    main()
