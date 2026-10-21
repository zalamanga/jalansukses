import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../public/', import.meta.url));
const pages = ['index.html', 'tentangkami.html', 'layanan.html', 'layananaplikasi.html', 'layananmanajemen.html', 'layananwebsite.html', 'layananmarketing.html', 'berita.html', 'artikel.html', 'hubungikami.html'];
const documents = new Map(await Promise.all(pages.map(async (file) => [file, (await readFile(path.join(root, file), 'utf8')).replace(/<!--[\s\S]*?-->/g, '')])));
const localOrigin = 'http://static.invalid';
const directoryEntries = new Map();

function localURL(reference, source) {
  if (!reference || /^(?:data:|mailto:|tel:|javascript:)/i.test(reference)) return null;
  const url = new URL(reference.replaceAll('&amp;', '&'), `${localOrigin}/${source}`);
  return url.origin === localOrigin ? url : null;
}

async function exactFile(relative) {
  const parts = relative.split('/').filter(Boolean);
  let directory = root;
  for (const part of parts) {
    if (!directoryEntries.has(directory)) directoryEntries.set(directory, readdir(directory, { withFileTypes: true }));
    const entry = (await directoryEntries.get(directory)).find((candidate) => candidate.name === part);
    assert.ok(entry, `Missing file or filename case mismatch: ${relative}`);
    directory = path.join(directory, part);
  }
}

function ids(html) {
  return [...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map((match) => match[1]);
}

async function walk(directory = '') {
  const output = [];
  for (const entry of await readdir(path.join(root, directory), { withFileTypes: true })) {
    const relative = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walk(relative));
    else output.push(relative);
  }
  return output;
}

test('all ten pages declare Indonesian, responsive metadata and unique element IDs', () => {
  const titles = [];
  for (const [file, html] of documents) {
    assert.match(html, /<!doctype html>/i, file);
    assert.match(html, /<html\b[^>]*lang=["']id["']/i, file);
    assert.match(html, /<meta\s+charset=["']utf-8["']/i, file);
    assert.match(html, /<meta\b[^>]*name=["']viewport["']/i, file);
    const title = html.match(/<title>([^<]+)<\/title>/i)?.[1].trim();
    assert.ok(title, `${file}: page title is required`);
    titles.push(title);
    const values = ids(html);
    assert.equal(new Set(values).size, values.length, `${file}: duplicate element IDs`);
  }
  assert.equal(new Set(titles).size, pages.length, 'Each page needs its own title');
});

test('local HTML assets resolve with portable filename casing', async () => {
  for (const [file, html] of documents) {
    const refs = [...html.matchAll(/<(?:script|img|link|iframe|source)\b[^>]*?\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)].map((match) => match[1]);
    const inlineImages = [...html.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/gi)].map((match) => match[1]);
    for (const ref of [...refs, ...inlineImages]) {
      const url = localURL(ref, file);
      if (url) await exactFile(decodeURIComponent(url.pathname));
    }
  }
});

test('links avoid placeholders and resolve to real local pages and fragment targets', async () => {
  for (const [file, html] of documents) {
    for (const match of html.matchAll(/<a\b[^>]*?\bhref\s*=\s*["']([^"']*)["']/gi)) {
      assert.ok(match[1].trim() && match[1] !== '#', `${file}: placeholder link`);
      assert.doesNotMatch(match[1], /^javascript:/i, `${file}: script URL`);
      const url = localURL(match[1], file);
      if (!url) continue;
      const target = decodeURIComponent(url.pathname).replace(/^\//, '') || 'index.html';
      await exactFile(target);
      if (url.hash.length > 1) {
        const targetHTML = documents.get(target);
        assert.ok(targetHTML, `${file}: expected HTML fragment target: ${match[1]}`);
        assert.ok(ids(targetHTML).includes(decodeURIComponent(url.hash.slice(1))), `${file}: missing fragment target ${match[1]}`);
      }
    }
  }
});

test('stylesheet image and font files resolve with portable filename casing', async () => {
  for (const file of (await walk('assets')).filter((relative) => relative.endsWith('.css'))) {
    const css = (await readFile(path.join(root, file), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '');
    for (const match of css.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/gi)) {
      const url = localURL(match[1], file);
      if (url && !match[1].startsWith('#')) await exactFile(decodeURIComponent(url.pathname));
    }
  }
});

test('static forms have no submission endpoint and explicitly disable their controls', () => {
  let formCount = 0;
  for (const [file, html] of documents) {
    for (const match of html.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi)) {
      formCount += 1;
      assert.doesNotMatch(match[1], /\b(?:action|method)\s*=/i, `${file}: form endpoint`);
      assert.match(match[2], /<fieldset\b[^>]*\bdisabled(?:\s|>|=)/i, `${file}: inactive form must disable its fieldset`);
      assert.match(match[2], /(?:belum|tidak)[\s\S]*?(?:kirim|tersedia|terhubung)/i, `${file}: explain the unavailable form`);
    }
  }
  assert.ok(formCount > 0, 'The existing contact form must be retained with an honest inactive state');
});

test('the public runtime contains no PHP, private settings, editor files or package tools', async () => {
  for (const file of await walk()) {
    assert.doesNotMatch(file, /(?:^|\/)(?:\.git|\.vscode|node_modules|vendor|backups)(?:\/|$)/i, file);
    assert.doesNotMatch(file, /(?:\.php\d*|\.sql|\.env|\.ini|\.pem|\.key|\.p12|\.pfx|\.DS_Store)$/i, file);
    assert.doesNotMatch(file, /(?:^|\/)(?:package(?:-lock)?\.json|composer(?:\.json|\.lock)|\.htaccess|\.user\.ini)$/i, file);
  }
});
