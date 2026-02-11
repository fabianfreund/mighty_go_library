import JSZip from "jszip";
import "./style.css";

const app = document.querySelector("#app");

const state = {
  categories: [],
  articles: [],
  locales: {},
  languages: [],
  selectedCategoryId: null,
  selectedArticleId: null,
  selectedLocale: null,
  mode: "idle",
  directoryHandle: null
};

const emptyLocaleEntry = () => ({
  title: "",
  text: "",
  link: "",
  linkLabel: ""
});

function render() {
  app.innerHTML = `
    <header>
      <div>
        <h1>Mighty Go Library Editor</h1>
        <div class="chips">
          <span class="chip">Mode: ${state.mode}</span>
          <span class="chip">Categories: ${state.categories.length}</span>
          <span class="chip">Articles: ${state.articles.length}</span>
        </div>
      </div>
      <div class="toolbar">
        <button class="secondary" id="btn-open-folder">Open Folder</button>
        <button class="secondary" id="btn-import-zip">Import ZIP</button>
        <button class="secondary" id="btn-export-zip" ${hasErrors() ? "disabled" : ""}>Export ZIP</button>
        <button class="accent" id="btn-save-folder" ${state.mode !== "folder" || hasErrors() ? "disabled" : ""}>Save To Folder</button>
      </div>
    </header>
    <div class="main">
      <section class="panel">
        <h2>Categories</h2>
        <div class="row">
          <input id="category-search" placeholder="Search categories" />
          <button id="btn-add-category">Add</button>
        </div>
        <div class="list" id="category-list"></div>
      </section>
      <section class="panel">
        <h2>Articles</h2>
        <div class="row">
          <input id="article-search" placeholder="Search articles" />
          <button id="btn-add-article">Add</button>
        </div>
        <div class="list" id="article-list"></div>
      </section>
      <section class="panel" id="editor-panel">
        <h2>Editor</h2>
        <div id="editor-content"></div>
      </section>
    </div>
    <div class="panel">
      <h2>Validation</h2>
      <div class="validation ${hasErrors() ? "" : "ok"}" id="validation-list"></div>
    </div>
  `;

  wireToolbar();
  renderCategories();
  renderArticles();
  renderEditor();
  renderValidation();
  bindDynamicActions();
}

function wireToolbar() {
  document.querySelector("#btn-open-folder").addEventListener("click", openFolder);
  document.querySelector("#btn-import-zip").addEventListener("click", promptZipImport);
  document.querySelector("#btn-export-zip").addEventListener("click", exportZip);
  document.querySelector("#btn-save-folder").addEventListener("click", saveToFolder);
  document.querySelector("#btn-add-category").addEventListener("click", addCategory);
  document.querySelector("#btn-add-article").addEventListener("click", addArticle);
  document.querySelector("#category-search").addEventListener("input", renderCategories);
  document.querySelector("#article-search").addEventListener("input", renderArticles);
}

function renderCategories() {
  const list = document.querySelector("#category-list");
  const query = document.querySelector("#category-search").value.trim().toLowerCase();
  const items = state.categories.filter((cat) => {
    if (!query) return true;
    return (
      cat.id.toLowerCase().includes(query) ||
      Object.values(cat.names || {}).some((name) => name.toLowerCase().includes(query))
    );
  });
  list.innerHTML = items
    .map((cat) => {
      const active = cat.id === state.selectedCategoryId ? "active" : "";
      return `<div class="list-item ${active}" data-id="${cat.id}">
        <strong>${cat.id}</strong>
        <div>${cat.names?.[state.languages[0]] || ""}</div>
      </div>`;
    })
    .join("");
  list.querySelectorAll(".list-item").forEach((item) => {
    item.addEventListener("click", () => {
      state.selectedCategoryId = item.dataset.id;
      const firstArticle = state.articles.find((a) => a.categoryId === state.selectedCategoryId);
      state.selectedArticleId = firstArticle ? firstArticle.id : null;
      render();
    });
  });
}

function renderArticles() {
  const list = document.querySelector("#article-list");
  const query = document.querySelector("#article-search").value.trim().toLowerCase();
  const items = state.articles.filter((article) => {
    if (state.selectedCategoryId && article.categoryId !== state.selectedCategoryId) return false;
    if (!query) return true;
    return article.id.toLowerCase().includes(query);
  });
  list.innerHTML = items
    .map((article) => {
      const active = article.id === state.selectedArticleId ? "active" : "";
      return `<div class="list-item ${active}" data-id="${article.id}">
        <strong>${article.id}</strong>
        <div>${article.categoryId}</div>
      </div>`;
    })
    .join("");
  list.querySelectorAll(".list-item").forEach((item) => {
    item.addEventListener("click", () => {
      state.selectedArticleId = item.dataset.id;
      render();
    });
  });
}

function renderEditor() {
  const panel = document.querySelector("#editor-content");
  if (!state.selectedCategoryId) {
    panel.innerHTML = "<p>Select a category to begin.</p>";
    return;
  }

  const category = state.categories.find((c) => c.id === state.selectedCategoryId);
  const article = state.articles.find((a) => a.id === state.selectedArticleId);

  if (!category) {
    panel.innerHTML = "<p>Category not found.</p>";
    return;
  }

  const localeTabs = state.languages
    .map((lang) => {
      const active = lang === state.selectedLocale ? "active" : "";
      return `<button class="locale-tab ${active}" data-lang="${lang}">${lang}</button>`;
    })
    .join("");

  panel.innerHTML = `
    <div class="field">
      <label>Category ID</label>
      <input id="category-id" value="${category.id}" />
    </div>
    <div class="row">
      ${state.languages
        .map(
          (lang) => `
        <div class="field">
          <label>Category Name (${lang})</label>
          <input data-lang="${lang}" data-field="name" value="${category.names?.[lang] || ""}" />
        </div>
        <div class="field">
          <label>Description (${lang})</label>
          <input data-lang="${lang}" data-field="description" value="${category.descriptions?.[lang] || ""}" />
        </div>
      `
        )
        .join("")}
    </div>
    <div class="field">
      <label>Icon</label>
      <input id="category-icon" value="${category.icon || ""}" />
    </div>
    <div class="row">
      <button class="secondary" id="btn-delete-category">Delete Category</button>
    </div>
    <hr />
    ${article ? renderArticleEditor(article, localeTabs) : "<p>Select an article to edit.</p>"}
  `;

  const categoryIdInput = panel.querySelector("#category-id");
  categoryIdInput.addEventListener("change", (event) => {
    const newId = event.target.value.trim();
    if (!newId || newId === category.id) return;
    if (!confirm(`Rename category to ${newId}? This updates article references.`)) return;
    renameCategory(category.id, newId);
  });

  panel.querySelectorAll("input[data-field='name']").forEach((input) => {
    input.addEventListener("input", (event) => {
      const lang = event.target.dataset.lang;
      category.names = { ...(category.names || {}), [lang]: event.target.value };
      renderValidation();
    });
  });

  panel.querySelectorAll("input[data-field='description']").forEach((input) => {
    input.addEventListener("input", (event) => {
      const lang = event.target.dataset.lang;
      category.descriptions = { ...(category.descriptions || {}), [lang]: event.target.value };
      renderValidation();
    });
  });

  const iconInput = panel.querySelector("#category-icon");
  iconInput.addEventListener("input", (event) => {
    category.icon = event.target.value;
    renderValidation();
  });

  const deleteCategoryButton = panel.querySelector("#btn-delete-category");
  deleteCategoryButton.addEventListener("click", () => deleteCategory(category.id));

  if (article) {
    panel.querySelectorAll(".locale-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        state.selectedLocale = tab.dataset.lang;
        render();
      });
    });

    panel.querySelector("#article-id").addEventListener("change", (event) => {
      const newId = event.target.value.trim();
      if (!newId || newId === article.id) return;
      if (!confirm(`Rename article to ${newId}? This updates locale entries.`)) return;
      renameArticle(article.id, newId);
    });

    panel.querySelector("#article-locked").addEventListener("change", (event) => {
      article.teacherLocked = event.target.checked;
      renderValidation();
    });

    panel.querySelectorAll("input[data-lang-choice]").forEach((input) => {
      input.addEventListener("change", () => {
        const selected = Array.from(panel.querySelectorAll("input[data-lang-choice]:checked")).map(
          (node) => node.value
        );
        article.availableLanguages = selected;
        ensureLocaleEntries(article.id);
        renderValidation();
      });
    });

    panel.querySelectorAll("input[data-locale-field], textarea[data-locale-field]").forEach((input) => {
      input.addEventListener("input", (event) => {
        const lang = event.target.dataset.lang;
        const field = event.target.dataset.localeField;
        const entry = getLocaleEntry(lang, article.id);
        entry[field] = event.target.value;
        renderValidation();
      });
    });
  }
}

function renderArticleEditor(article, localeTabs) {
  const selectedLang = state.selectedLocale || state.languages[0];
  state.selectedLocale = selectedLang;
  const entry = getLocaleEntry(selectedLang, article.id);
  return `
    <div class="field">
      <label>Article ID</label>
      <input id="article-id" value="${article.id}" />
    </div>
    <div class="row">
      <div class="field">
        <label>Category</label>
        <select id="article-category">
          ${state.categories
            .map(
              (cat) =>
                `<option value="${cat.id}" ${cat.id === article.categoryId ? "selected" : ""}>${cat.id}</option>`
            )
            .join("")}
        </select>
      </div>
      <div class="field">
        <label>Teacher Locked</label>
        <input type="checkbox" id="article-locked" ${article.teacherLocked ? "checked" : ""} />
      </div>
    </div>
    <div class="field">
      <label>Available Languages</label>
      <div class="chips">
        ${state.languages
          .map(
            (lang) => `
          <label class="chip">
            <input type="checkbox" data-lang-choice value="${lang}" ${
              article.availableLanguages?.includes(lang) ? "checked" : ""
            } /> ${lang}
          </label>
        `
          )
          .join("")}
      </div>
    </div>
    <div class="field">
      <label>Locale</label>
      <div class="locale-tabs">${localeTabs}</div>
    </div>
    <div class="field">
      <label>Title (${selectedLang})</label>
      <input data-locale-field="title" data-lang="${selectedLang}" value="${entry.title}" />
    </div>
    <div class="field">
      <label>Text (${selectedLang})</label>
      <textarea data-locale-field="text" data-lang="${selectedLang}">${entry.text}</textarea>
    </div>
    <div class="row">
      <div class="field">
        <label>Link (${selectedLang})</label>
        <input data-locale-field="link" data-lang="${selectedLang}" value="${entry.link}" />
      </div>
      <div class="field">
        <label>Link Label (${selectedLang})</label>
        <input data-locale-field="linkLabel" data-lang="${selectedLang}" value="${entry.linkLabel}" />
      </div>
    </div>
    <div class="row">
      <button class="secondary" id="btn-delete-article">Delete Article</button>
    </div>
  `;
}

function renderValidation() {
  const list = document.querySelector("#validation-list");
  if (!list) return;
  const errors = validate();
  if (errors.length === 0) {
    list.classList.add("ok");
    list.innerHTML = "All checks passed. Export is ready.";
    return;
  }
  list.classList.remove("ok");
  list.innerHTML = `<ul>${errors.map((err) => `<li>${err}</li>`).join("")}</ul>`;
}

function hasErrors() {
  return validate().length > 0;
}

function validate() {
  const errors = [];
  const categoryIds = new Set();
  state.categories.forEach((cat) => {
    if (categoryIds.has(cat.id)) errors.push(`Duplicate category id: ${cat.id}`);
    categoryIds.add(cat.id);
    if (!cat.icon) errors.push(`Category ${cat.id} is missing icon`);
    state.languages.forEach((lang) => {
      if (!cat.names?.[lang]) errors.push(`Category ${cat.id} missing name for ${lang}`);
      const desc = cat.descriptions?.[lang] || "";
      if (!desc) {
        errors.push(`Category ${cat.id} missing description for ${lang}`);
      } else {
        const words = countWords(desc);
        if (words < 4 || words > 5) {
          errors.push(`Category ${cat.id} description (${lang}) should be 4-5 words`);
        }
      }
    });
  });

  const articleIds = new Set();
  state.articles.forEach((article) => {
    if (articleIds.has(article.id)) errors.push(`Duplicate article id: ${article.id}`);
    articleIds.add(article.id);
    if (!categoryIds.has(article.categoryId)) {
      errors.push(`Article ${article.id} has invalid categoryId ${article.categoryId}`);
    }
    if (!Array.isArray(article.availableLanguages) || article.availableLanguages.length === 0) {
      errors.push(`Article ${article.id} has no availableLanguages`);
    } else {
      article.availableLanguages.forEach((lang) => {
        if (!state.languages.includes(lang)) {
          errors.push(`Article ${article.id} has unknown language ${lang}`);
        }
      });
    }
  });

  state.articles.forEach((article) => {
    (article.availableLanguages || []).forEach((lang) => {
      const entry = state.locales?.[lang]?.[article.id];
      if (!entry) {
        errors.push(`Missing locale entry for ${article.id} (${lang})`);
        return;
      }
      ["title", "text", "link", "linkLabel"].forEach((field) => {
        if (entry[field] === undefined) {
          errors.push(`Locale ${article.id} (${lang}) missing field ${field}`);
        }
      });
    });
  });

  Object.entries(state.locales).forEach(([lang, entries]) => {
    Object.keys(entries).forEach((articleId) => {
      if (!articleIds.has(articleId)) {
        errors.push(`Dangling locale entry ${articleId} in ${lang}`);
      }
    });
  });

  return errors;
}

function countWords(text) {
  const matches = text.match(/[\p{L}\p{N}]+/gu);
  return matches ? matches.length : 0;
}

function addCategory() {
  const id = prompt("New category id?");
  if (!id) return;
  if (state.categories.some((cat) => cat.id === id)) {
    alert("Category id already exists.");
    return;
  }
  const names = {};
  const descriptions = {};
  state.languages.forEach((lang) => {
    names[lang] = "";
    descriptions[lang] = "";
  });
  state.categories.push({ id, icon: "", names, descriptions });
  state.selectedCategoryId = id;
  render();
}

function deleteCategory(categoryId) {
  const relatedArticles = state.articles.filter((a) => a.categoryId === categoryId);
  if (!confirm(`Delete category ${categoryId} and ${relatedArticles.length} articles?`)) return;
  state.categories = state.categories.filter((cat) => cat.id !== categoryId);
  const removedArticles = state.articles.filter((article) => article.categoryId === categoryId);
  state.articles = state.articles.filter((article) => article.categoryId !== categoryId);
  removedArticles.forEach((article) => removeLocaleEntries(article.id));
  state.selectedCategoryId = state.categories[0]?.id || null;
  state.selectedArticleId = null;
  render();
}

function renameCategory(oldId, newId) {
  if (state.categories.some((cat) => cat.id === newId)) {
    alert("Category id already exists.");
    return;
  }
  state.categories.forEach((cat) => {
    if (cat.id === oldId) cat.id = newId;
  });
  state.articles.forEach((article) => {
    if (article.categoryId === oldId) article.categoryId = newId;
  });
  state.selectedCategoryId = newId;
  render();
}

function addArticle() {
  if (!state.selectedCategoryId) {
    alert("Select a category first.");
    return;
  }
  const id = prompt("New article id?");
  if (!id) return;
  if (state.articles.some((article) => article.id === id)) {
    alert("Article id already exists.");
    return;
  }
  const article = {
    id,
    categoryId: state.selectedCategoryId,
    teacherLocked: false,
    availableLanguages: [...state.languages]
  };
  state.articles.push(article);
  ensureLocaleEntries(id);
  state.selectedArticleId = id;
  render();
}

function deleteArticle(articleId) {
  if (!confirm(`Delete article ${articleId}?`)) return;
  state.articles = state.articles.filter((article) => article.id !== articleId);
  removeLocaleEntries(articleId);
  state.selectedArticleId = state.articles.find((a) => a.categoryId === state.selectedCategoryId)?.id || null;
  render();
}

function renameArticle(oldId, newId) {
  if (state.articles.some((article) => article.id === newId)) {
    alert("Article id already exists.");
    return;
  }
  state.articles.forEach((article) => {
    if (article.id === oldId) article.id = newId;
  });
  Object.entries(state.locales).forEach(([lang, entries]) => {
    if (entries[oldId]) {
      entries[newId] = entries[oldId];
      delete entries[oldId];
    }
  });
  state.selectedArticleId = newId;
  render();
}

function ensureLocaleEntries(articleId) {
  state.languages.forEach((lang) => {
    state.locales[lang] = state.locales[lang] || {};
    if (!state.locales[lang][articleId]) {
      state.locales[lang][articleId] = emptyLocaleEntry();
    }
  });
}

function removeLocaleEntries(articleId) {
  Object.keys(state.locales).forEach((lang) => {
    delete state.locales[lang][articleId];
  });
}

function getLocaleEntry(lang, articleId) {
  state.locales[lang] = state.locales[lang] || {};
  state.locales[lang][articleId] = state.locales[lang][articleId] || emptyLocaleEntry();
  return state.locales[lang][articleId];
}

async function openFolder() {
  try {
    const handle = await window.showDirectoryPicker();
    state.directoryHandle = handle;
    await loadFromFolder(handle);
    state.mode = "folder";
    render();
  } catch (err) {
    console.error(err);
  }
}

async function loadFromFolder(handle) {
  const categories = await readJsonFile(handle, "categories.json");
  const articlesDir = await handle.getDirectoryHandle("articles");
  const localesDir = await handle.getDirectoryHandle("locales");
  const languages = [];
  for await (const entry of localesDir.values()) {
    if (entry.kind === "directory") languages.push(entry.name);
  }
  const articles = [];
  for (const cat of categories) {
    const file = await articlesDir.getFileHandle(`${cat.id}.json`);
    const data = JSON.parse(await (await file.getFile()).text());
    articles.push(...data);
  }
  const locales = {};
  for (const lang of languages) {
    locales[lang] = {};
    const langDir = await localesDir.getDirectoryHandle(lang);
    for (const cat of categories) {
      const fileHandle = await langDir.getFileHandle(`${cat.id}.json`);
      const data = JSON.parse(await (await fileHandle.getFile()).text());
      Object.assign(locales[lang], data);
    }
  }
  assignState({ categories, articles, locales, languages });
}

async function readJsonFile(rootHandle, name) {
  const fileHandle = await rootHandle.getFileHandle(name);
  const file = await fileHandle.getFile();
  return JSON.parse(await file.text());
}

function promptZipImport() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".zip";
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;
    await importZip(file);
  });
  input.click();
}

async function importZip(file) {
  const zip = await JSZip.loadAsync(file);
  const categories = await readZipJson(zip, "categories.json");
  const articles = [];
  const locales = {};
  const languages = new Set();

  const articleFiles = Object.keys(zip.files).filter((name) => name.startsWith("articles/") && name.endsWith(".json"));
  for (const fileName of articleFiles) {
    const data = await readZipJson(zip, fileName);
    articles.push(...data);
  }

  const localeFiles = Object.keys(zip.files).filter((name) => name.startsWith("locales/") && name.endsWith(".json"));
  for (const fileName of localeFiles) {
    const parts = fileName.split("/");
    const lang = parts[1];
    languages.add(lang);
    locales[lang] = locales[lang] || {};
    const data = await readZipJson(zip, fileName);
    Object.assign(locales[lang], data);
  }

  assignState({ categories, articles, locales, languages: Array.from(languages) });
  state.mode = "zip";
  render();
}

async function readZipJson(zip, path) {
  const file = zip.file(path);
  if (!file) throw new Error(`Missing ${path} in zip`);
  const text = await file.async("string");
  return JSON.parse(text);
}

function assignState({ categories, articles, locales, languages }) {
  state.categories = categories || [];
  state.articles = articles || [];
  state.locales = locales || {};
  state.languages = languages || [];
  state.selectedCategoryId = state.categories[0]?.id || null;
  state.selectedArticleId = state.articles.find((a) => a.categoryId === state.selectedCategoryId)?.id || null;
  state.selectedLocale = state.languages[0] || null;
}

async function exportZip() {
  const zip = new JSZip();
  zip.file("categories.json", JSON.stringify(state.categories, null, 2));
  const articlesDir = zip.folder("articles");
  const localesDir = zip.folder("locales");

  state.categories.forEach((cat) => {
    const catArticles = state.articles.filter((article) => article.categoryId === cat.id);
    articlesDir.file(`${cat.id}.json`, JSON.stringify(catArticles, null, 2));
  });

  state.languages.forEach((lang) => {
    const langDir = localesDir.folder(lang);
    state.categories.forEach((cat) => {
      const entries = {};
      state.articles
        .filter((article) => article.categoryId === cat.id && article.availableLanguages?.includes(lang))
        .forEach((article) => {
          entries[article.id] = getLocaleEntry(lang, article.id);
        });
      langDir.file(`${cat.id}.json`, JSON.stringify(entries, null, 2));
    });
  });

  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, "mighty-go-library.zip");
}

async function saveToFolder() {
  if (!state.directoryHandle) return;
  if (hasErrors()) {
    alert("Fix validation errors before saving.");
    return;
  }
  await writeJsonFile(state.directoryHandle, "categories.json", state.categories);
  const articlesDir = await state.directoryHandle.getDirectoryHandle("articles", { create: true });
  for (const cat of state.categories) {
    const data = state.articles.filter((article) => article.categoryId === cat.id);
    await writeJsonFile(articlesDir, `${cat.id}.json`, data);
  }
  const localesDir = await state.directoryHandle.getDirectoryHandle("locales", { create: true });
  for (const lang of state.languages) {
    const langDir = await localesDir.getDirectoryHandle(lang, { create: true });
    for (const cat of state.categories) {
      const entries = {};
      state.articles
        .filter((article) => article.categoryId === cat.id && article.availableLanguages?.includes(lang))
        .forEach((article) => {
          entries[article.id] = getLocaleEntry(lang, article.id);
        });
      await writeJsonFile(langDir, `${cat.id}.json`, entries);
    }
  }
  alert("Saved to folder.");
}

async function writeJsonFile(dirHandle, name, data) {
  const fileHandle = await dirHandle.getFileHandle(name, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(data, null, 2));
  await writable.close();
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function bindDynamicActions() {
  const deleteArticleButton = document.querySelector("#btn-delete-article");
  if (deleteArticleButton) {
    deleteArticleButton.addEventListener("click", () => deleteArticle(state.selectedArticleId));
  }
  const categorySelect = document.querySelector("#article-category");
  if (categorySelect) {
    categorySelect.addEventListener("change", (event) => {
      const article = state.articles.find((a) => a.id === state.selectedArticleId);
      if (!article) return;
      article.categoryId = event.target.value;
      state.selectedCategoryId = article.categoryId;
      render();
    });
  }
}

render();
