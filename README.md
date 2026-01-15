# History Timeline Starter (VN + CN)

This starter gives you:
- JSON Schema for period items: `data/schema/period.schema.json`
- Dataset (VN + CN): `data/vietnam/periods.json`, `data/china/periods.json`
- Source registry: `data/sources/sources.json`
- Validator script: `scripts/validate-data.js`
- Safe AI drafting workflow: `docs/ai-pipeline.md`

## Cách chạy ứng dụng

### Cách 1: Sử dụng server HTTP (khuyên dùng)
```bash
# Nếu có Python
python -m http.server 8080

# Nếu có Node.js
npx serve . -p 8080
```

Sau đó mở: http://localhost:8080/app.html

### Cách 2: Mở trực tiếp trong browser (có thể cần tắt CORS)
- Chrome: Mở với flag `--disable-web-security --user-data-dir="C:\chrome-dev"`
- Firefox: Trong about:config, set `security.fileuri.strict_origin_policy` thành false

### Cách 3: Sử dụng extension browser
Cài extension "Allow CORS" hoặc "CORS Unblock" để bypass CORS restrictions.

## Quick validation
Requires Node.js (for the validator script):
    node scripts/validate-data.js

## Important
The dataset includes some real high-level periods plus many PLACEHOLDER_TODO items so you have a 100+ skeleton immediately.
Replace TODO items gradually with verified content and correct sources.

## Historical maps (license-safe)
The app supports a **per-period historical map image** via the `map` field in each period.

- In this version, maps are **hotlinked from Wikimedia Commons** (no downloads required).
- Attribution & license references: `docs/maps-attribution.md`.
- To add/replace a map for a period: edit `map.src` (use `Special:FilePath/<filename>?width=...`) and update attribution fields.
