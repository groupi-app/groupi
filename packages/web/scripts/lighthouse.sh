#!/usr/bin/env bash
set -euo pipefail

# Lighthouse performance check for Groupi
# Usage:
#   ./packages/web/scripts/lighthouse.sh              # test production (www.groupi.gg)
#   ./packages/web/scripts/lighthouse.sh dev           # test local dev (localhost:3000)
#   ./packages/web/scripts/lighthouse.sh <url>         # test any URL
#   ./packages/web/scripts/lighthouse.sh --json        # output full JSON report
#   ./packages/web/scripts/lighthouse.sh dev --json    # combine options

URL="https://www.groupi.gg"
JSON_OUTPUT=false
REPORT_DIR="packages/web/lighthouse-reports"

for arg in "$@"; do
  case "$arg" in
    dev|local)
      URL="http://localhost:3000"
      ;;
    --json)
      JSON_OUTPUT=true
      ;;
    http*)
      URL="$arg"
      ;;
  esac
done

CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ ! -f "$CHROME_PATH" ]; then
  CHROME_PATH=$(which google-chrome 2>/dev/null || which chromium 2>/dev/null || echo "")
  if [ -z "$CHROME_PATH" ]; then
    echo "Error: Chrome/Chromium not found"
    exit 1
  fi
fi

mkdir -p "$REPORT_DIR"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REPORT_FILE="$REPORT_DIR/report-$TIMESTAMP.json"

echo "Running Lighthouse against: $URL"
echo "Strategy: mobile"
echo ""

CHROME_PATH="$CHROME_PATH" npx lighthouse "$URL" \
  --output=json \
  --output-path="$REPORT_FILE" \
  --chrome-flags="--headless --no-sandbox --disable-gpu" \
  --form-factor=mobile \
  --throttling-method=simulate \
  --only-categories=performance,accessibility,best-practices,seo \
  --quiet \
  2>/dev/null

if [ "$JSON_OUTPUT" = true ]; then
  cat "$REPORT_FILE"
  exit 0
fi

python3 -c "
import json, sys

with open('$REPORT_FILE') as f:
    data = json.load(f)

cats = data.get('categories', {})
audits = data.get('audits', {})

print('=' * 60)
print('LIGHTHOUSE REPORT')
print('=' * 60)
print(f\"URL: {data.get('finalUrl', data.get('requestedUrl', '?'))}\")
print(f\"Device: {data.get('configSettings', {}).get('formFactor', '?')}\")
print()

# Scores
print('SCORES')
print('-' * 40)
for key in ['performance', 'accessibility', 'best-practices', 'seo']:
    cat = cats.get(key, {})
    score = cat.get('score')
    if score is not None:
        score_pct = int(score * 100)
        rating = '🟢' if score_pct >= 90 else '🟠' if score_pct >= 50 else '🔴'
        print(f'  {rating} {cat.get(\"title\", key):20s} {score_pct}')
print()

# Core Web Vitals
print('CORE WEB VITALS')
print('-' * 40)
metrics = [
    ('first-contentful-paint', 'FCP'),
    ('largest-contentful-paint', 'LCP'),
    ('total-blocking-time', 'TBT'),
    ('cumulative-layout-shift', 'CLS'),
    ('speed-index', 'Speed Index'),
    ('interactive', 'TTI'),
]
for audit_id, label in metrics:
    a = audits.get(audit_id, {})
    score = a.get('score')
    if score is not None:
        rating = '🟢' if score >= 0.9 else '🟠' if score >= 0.5 else '🔴'
        print(f'  {rating} {label:15s} {a.get(\"displayValue\", \"?\")}')
print()

# LCP breakdown
lcp_audit = audits.get('lcp-lazy-load', audits.get('largest-contentful-paint-element', {}))
lcp_elem = audits.get('largest-contentful-paint-element', {})
if lcp_elem.get('details', {}).get('items'):
    items = lcp_elem['details']['items']
    print('LCP ELEMENT')
    print('-' * 40)
    for item in items:
        node = item.get('node', {})
        if node.get('snippet'):
            print(f'  {node[\"snippet\"][:80]}')
    print()

# Opportunities
print('OPPORTUNITIES')
print('-' * 40)
opps = []
for key, a in audits.items():
    details = a.get('details', {})
    if details.get('type') == 'opportunity' and a.get('score') is not None and a['score'] < 1:
        savings = details.get('overallSavingsMs', 0)
        opps.append((savings, a.get('title', key), a.get('displayValue', '')))
opps.sort(reverse=True)
for savings, title, display in opps:
    print(f'  {title}: {display} (est. {savings:.0f}ms)')
if not opps:
    print('  None found')
print()

# Diagnostics
print('DIAGNOSTICS')
print('-' * 40)
diag_keys = [
    'mainthread-work-breakdown',
    'bootup-time',
    'unused-javascript',
    'legacy-javascript',
    'dom-size',
    'total-byte-weight',
    'long-tasks',
    'render-blocking-resources',
    'third-party-summary',
    'network-rtt',
    'network-server-latency',
]
for key in diag_keys:
    a = audits.get(key, {})
    if a and a.get('score') is not None and a['score'] < 1:
        print(f'  🔴 {a.get(\"title\", key)}: {a.get(\"displayValue\", \"\")}')
    elif a and a.get('displayValue'):
        print(f'  ⚪ {a.get(\"title\", key)}: {a.get(\"displayValue\", \"\")}')

# Unused JS details
unused_js = audits.get('unused-javascript', {})
if unused_js.get('details', {}).get('items'):
    print()
    print('UNUSED JAVASCRIPT (top 10)')
    print('-' * 40)
    items = unused_js['details']['items'][:10]
    for item in items:
        url = item.get('url', '?')
        url_short = url.split('/')[-1][:50] if '/' in url else url[:50]
        waste = item.get('wastedBytes', 0) / 1024
        total = item.get('totalBytes', 0) / 1024
        print(f'  {url_short:50s} {waste:6.1f} / {total:6.1f} KiB wasted')

# Render-blocking resources
rb = audits.get('render-blocking-resources', {})
if rb.get('details', {}).get('items'):
    print()
    print('RENDER-BLOCKING RESOURCES')
    print('-' * 40)
    for item in rb['details']['items']:
        url = item.get('url', '?')
        url_short = url.split('/')[-1][:50] if '/' in url else url[:50]
        size = item.get('totalBytes', 0) / 1024
        waste = item.get('wastedMs', 0)
        print(f'  {url_short:50s} {size:6.1f} KiB  {waste:.0f}ms')

# Third-party summary
tp = audits.get('third-party-summary', {})
if tp.get('details', {}).get('items'):
    print()
    print('THIRD-PARTY SCRIPTS')
    print('-' * 40)
    for item in tp['details']['items'][:5]:
        entity = item.get('entity', '?')
        if isinstance(entity, dict):
            entity = entity.get('text', entity.get('url', '?'))
        size = item.get('transferSize', 0) / 1024
        bt = item.get('blockingTime', 0)
        print(f'  {str(entity):35s} {size:6.1f} KiB  blocking: {bt:.0f}ms')

print()
print(f'Full report: {\"$REPORT_FILE\"}')
print('=' * 60)
"

# Cleanup old reports (keep last 10)
ls -t "$REPORT_DIR"/report-*.json 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
