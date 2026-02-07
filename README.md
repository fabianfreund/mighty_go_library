# Mighty Go Library Guides

This folder contains practical guidance for maintaining the content that powers the Mighty Go in-app library.

## Repository Layout
- `categories.json`
  - Defines the library categories and their localized names.
- `articles.json`
  - Global index of all articles and their metadata.
- `locales/{lang}.json`
  - Language bundles that hold the actual article text for each locale.

## Add A New Category
1. Add a new entry to `categories.json`.
2. Use a stable `id` and provide `names` for each supported language.
3. Pick an icon from the Expo Ionicons set (use the outline variants when possible).

Example:
```json
{
  "id": "focus",
  "icon": "sparkles-outline",
  "names": {
    "en": "Focus & Flow",
    "ru": "Фокус и поток"
  }
}
```

## Add A New Article
1. Add a new entry to `articles.json`.
2. Reference an existing `categoryId`.
3. Set `teacherLocked` to `true` if only teacher-linked students should see it.
4. List every language you plan to ship in `availableLanguages`.

Example:
```json
{
  "id": "morning-reset",
  "categoryId": "focus",
  "teacherLocked": false,
  "availableLanguages": ["en", "ru"]
}
```

## Add Article Content
1. Open `locales/{lang}.json` for each language in `availableLanguages`.
2. Add a matching key with `title` and `text` (and optional `link`, `linkLabel`).

Example:
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

## Review Checklist
- Category IDs match article `categoryId` values.
- Article IDs exist in every locale file listed in `availableLanguages`.
- `teacherLocked` is only used when the article should be hidden from unlinked students.
- JSON stays valid (run a JSON formatter before commit).
