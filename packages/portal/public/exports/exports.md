# Canonical docs for your own agent

v2 · Current · Source: packages/portal/scripts/generate-content.ts

Source availability does not establish hosted deployment or registry publication.

## Public Markdown, text and JSON
Canonical passage: /v2/exports#formats

Download Markdown or plain text for any page, or retrieve the public JSON passage index and llms.txt. Exports use the same canonical corpus, versions, availability and source hashes as the portal. No account, hosted answer assistant or authenticated machine-query service is needed. Private events, credentials and repository planning are excluded.

```sh
curl --fail https://YOUR-PORTAL/llms.txt
curl --fail https://YOUR-PORTAL/exports/integrator.md
curl --fail https://YOUR-PORTAL/exports/search-index.json
```
