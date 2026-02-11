import json
import os

def split_library():
    # Load original files
    try:
        with open('categories.json', 'r', encoding='utf-8') as f:
            categories = json.load(f)

        with open('articles.json', 'r', encoding='utf-8') as f:
            articles = json.load(f)

        locales = {}
        for lang in ['en', 'ru']:
            lang_file = f'locales/{lang}.json'
            if os.path.exists(lang_file):
                with open(lang_file, 'r', encoding='utf-8') as f:
                    locales[lang] = json.load(f)
            else:
                locales[lang] = {}
    except FileNotFoundError as e:
        print(f"Error: Missing required file: {e.filename}")
        return
    except json.JSONDecodeError as e:
        print(f"Error: Failed to decode JSON: {e}")
        return

    # Create directories
    os.makedirs('articles', exist_ok=True)
    for lang in locales:
        os.makedirs(f'locales/{lang}', exist_ok=True)

    # Split articles by category
    for cat in categories:
        cat_id = cat['id']
        cat_articles = [a for a in articles if a['categoryId'] == cat_id]

        # Save article metadata
        metadata_path = f'articles/{cat_id}.json'
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(cat_articles, f, indent=2, ensure_ascii=False)
        print(f"Created {metadata_path}")

        # Save localized content
        for lang, content in locales.items():
            cat_locale_content = {}
            for art in cat_articles:
                art_id = art['id']
                if art_id in content:
                    cat_locale_content[art_id] = content[art_id]

            locale_path = f'locales/{lang}/{cat_id}.json'
            with open(locale_path, 'w', encoding='utf-8') as f:
                json.dump(cat_locale_content, f, indent=2, ensure_ascii=False)
            print(f"Created {locale_path}")

if __name__ == '__main__':
    split_library()
