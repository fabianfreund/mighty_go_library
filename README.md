# Mighty Go Library

Content repository for the Mighty Go in-app library. The mobile app fetches the JSON files from this repo and renders categories, articles, and localized content.

## Repository Layout
- `categories.json`
  - Category metadata with localized titles and short descriptions.
- `articles.json`
  - Global index of all articles and their metadata.
- `locales/{lang}.json`
  - Language bundles with article content per locale.
- `guides/README.md`
  - Authoring guide and examples.

## Category Schema
```json
{
  "id": "focus",
  "icon": "sparkles-outline",
  "names": {
    "en": "Focus & Flow",
    "ru": "Фокус и поток"
  },
  "descriptions": {
    "en": "Short focus routines",
    "ru": "Короткие фокус практики"
  }
}
```

## Article Schema
```json
{
  "id": "morning-reset",
  "categoryId": "focus",
  "teacherLocked": false,
  "availableLanguages": ["en", "ru"]
}
```

## Locale Entry Schema
```json
{
  "morning-reset": {
    "title": "Morning Reset",
    "text": "Start with two minutes of breathing...",
    "link": "https://example.com",
    "linkLabel": "Read more"
  }
}
```

## Notes
- Each article only needs the locales listed in `availableLanguages`.
- Missing locale files will cause a 404 in the app, so always add a file for each supported language (even if empty).
- Article `text` supports limited HTML tags in the app: `p`, `br`, `strong`, `em`, `ol`, `ul`, `li`, `pre`, `code`.
