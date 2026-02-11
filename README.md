# Mighty Go Library

Content repository for the Mighty Go in-app library. The mobile app fetches the JSON files from this repo and renders categories, articles, and localized content.

## Repository Layout
- `categories.json`
  - Master list of categories and their metadata.
- `articles/`
  - Article metadata split by category (e.g., `articles/focus.json`).
- `locales/`
  - Translations split by language and category (e.g., `locales/en/focus.json`).
- `src/scripts/`
  - Utility scripts for maintenance and migration.

## How to Update

### 1. Adding a New Category
1. Add a new entry to `categories.json`.
2. Create a new JSON file in `articles/` named after your category ID (e.g., `new-category.json`).
3. Create corresponding translation files in `locales/{lang}/new-category.json`.

### 2. Adding a New Article
1. Find the category file in `articles/{categoryId}.json` and add the article metadata:
```json
{
  "id": "new-article-id",
  "categoryId": "category-id",
  "teacherLocked": false,
  "availableLanguages": ["en", "ru"]
}
```
2. Add the content to the respective language files in `locales/{lang}/{categoryId}.json`:
```json
{
  "new-article-id": {
    "title": "Article Title",
    "text": "<p>Article content in HTML or plain text</p>",
    "link": "https://optional-link.com",
    "linkLabel": "Read More"
  }
}
```

## Schema Definitions

### Category (categories.json)
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

### Article Metadata (articles/{categoryId}.json)
```json
{
  "id": "morning-reset",
  "categoryId": "focus",
  "teacherLocked": false,
  "availableLanguages": ["en", "ru"]
}
```

### Locale Entry (locales/{lang}/{categoryId}.json)
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
- Modular structure: Small, category-specific files allow for easier maintenance and better integration with AI tools.
- Article `text` supports limited HTML tags in the app: `p`, `br`, `strong`, `em`, `ol`, `ul`, `li`, `pre`, `code`.
