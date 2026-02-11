<INSTRUCTIONS>
# AGENTS

This repo contains the content for the Mighty Go library. It is consumed by the Mighty Go app at runtime.

## Project Overview
- Repo name: mighty_go_library
- Purpose: Remote library content (categories + articles + localized text)
- Consumers: Mighty Go app (Expo/React Native)

## Agent Roles

### Archivist 📚
- **Mission:** Maintain repo clarity and alignment.
- **Tasks:** Update docs (`README.md`, `AGENTS.md`).
- **Focus:** Documentation accuracy and content structure.

## Structure
- `categories.json`: Master list of categories.
- `articles/`: Article metadata files, one per category ID.
- `locales/`: Localized article content, organized by `{lang}/{categoryId}.json`.
- `src/scripts/`: Maintenance scripts (e.g., `split_library.py`).

## Conventions
- Keep JSON valid and formatted.
- `id` values must be stable and unique.
- `availableLanguages` controls which locale files must include the article.
- Category `descriptions` should be 4–5 words.
- Icons are Ionicons names (prefer outline variants).

## Output Expectations
- Keep changes minimal and focused.
- Provide a short summary of modifications and relevant commands.
</INSTRUCTIONS>
