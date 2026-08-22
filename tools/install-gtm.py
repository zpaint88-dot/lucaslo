#!/usr/bin/env python3
"""
Install Google Tag Manager (GTM) into all HTML files of zpaintcar.com.
Reads GTM container ID from command line and injects the snippets.

Usage:
    python install-gtm.py <GTM-XXXXXXX> <repo_path>

Example:
    python install-gtm.py GTM-ABC1234 /tmp/lucaslo
"""
import os
import re
import sys
from pathlib import Path

GTM_HEAD_MARKER = "<!-- Google Tag Manager -->"
GTM_BODY_MARKER = "<!-- Google Tag Manager (noscript) -->"

def head_snippet(gtm_id: str) -> str:
    return f"""<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){{w[l]=w[l]||[];w[l].push({{'gtm.start':
new Date().getTime(),event:'gtm.js'}});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
}})(window,document,'script','dataLayer','{gtm_id}');</script>
<!-- End Google Tag Manager -->
"""

def body_snippet(gtm_id: str) -> str:
    return f"""<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id={gtm_id}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
"""

def install(html: str, gtm_id: str) -> str:
    if GTM_HEAD_MARKER in html:
        # Already installed — replace old ID to keep it fresh
        html = re.sub(
            r"<!-- Google Tag Manager -->.*?<!-- End Google Tag Manager -->\s*",
            head_snippet(gtm_id),
            html,
            flags=re.DOTALL,
        )
        html = re.sub(
            r"<!-- Google Tag Manager \(noscript\) -->.*?<!-- End Google Tag Manager \(noscript\) -->\s*",
            body_snippet(gtm_id),
            html,
            flags=re.DOTALL,
        )
        return html

    # Insert head snippet right after <head> or <head ...>
    html = re.sub(
        r"(<head[^>]*>)",
        r"\1\n" + head_snippet(gtm_id),
        html,
        count=1,
    )
    # Insert body snippet right after <body> or <body ...>
    html = re.sub(
        r"(<body[^>]*>)",
        r"\1\n" + body_snippet(gtm_id),
        html,
        count=1,
    )
    return html

def main():
    if len(sys.argv) < 3:
        print("Usage: python install-gtm.py <GTM-XXXXXXX> <repo_path>")
        sys.exit(1)

    gtm_id = sys.argv[1]
    repo = Path(sys.argv[2])

    if not re.match(r"^GTM-[A-Z0-9]+$", gtm_id):
        print(f"Invalid GTM ID: {gtm_id}")
        sys.exit(1)

    if not repo.exists():
        print(f"Repo path not found: {repo}")
        sys.exit(1)

    html_files = list(repo.glob("*.html")) + list(repo.glob("blog/*.html"))
    print(f"Found {len(html_files)} HTML files")

    changed = 0
    for f in html_files:
        original = f.read_text(encoding="utf-8")
        updated = install(original, gtm_id)
        if updated != original:
            f.write_text(updated, encoding="utf-8")
            changed += 1
            print(f"  ✓ {f.relative_to(repo)}")

    print(f"\nDone. Updated {changed} files with GTM ID: {gtm_id}")

if __name__ == "__main__":
    main()
