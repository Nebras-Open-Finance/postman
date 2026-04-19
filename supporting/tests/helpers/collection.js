const fs = require('node:fs');
const path = require('node:path');
const { repoRoot } = require('./config');

const cache = new Map();

function loadCollection(name) {
  if (cache.has(name)) return cache.get(name);
  const filePath = path.join(repoRoot, `${name}.postman_collection.json`);
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  cache.set(name, parsed);
  return parsed;
}

// Find a nested folder by its path of folder names, e.g. ['Insurance v2.1', 'Quotation', 'Motor Insurance'].
function findFolder(items, folderPath) {
  if (folderPath.length === 0) return { item: items };
  const [head, ...rest] = folderPath;
  for (const it of items || []) {
    if (it.name === head && Array.isArray(it.item)) {
      if (rest.length === 0) return it;
      const found = findFolder(it.item, rest);
      if (found) return found;
    }
  }
  return null;
}

// Enumerate testable flows under a folder. A flow is any folder whose
// direct children include a request matching `stopAt`. Variant subfolders
// (e.g. "(with login_hint)") are yielded as separate flows; the vanilla
// flow excludes them by keeping only direct requests.
//
// When `includeNonStop` is true, leaf folders with no stop-point match
// are also yielded (for cc-grant-only areas like Atms / Products & Leads).
function enumerateFlows(items, folderPath, stopAt, includeNonStop = false) {
  const root = findFolder(items, folderPath);
  if (!root) throw new Error(`Folder not found: ${folderPath.join(' > ')}`);
  const flows = [];

  function walk(node, path) {
    const children = node.item || [];
    const directRequests = children.filter(c => c.request);
    const subFolders = children.filter(c => Array.isArray(c.item));
    const directHit = directRequests.some(stopAt);

    if (directHit) {
      flows.push({
        name: path.join(' > '),
        folder: { ...node, item: directRequests },
      });
    } else if (includeNonStop && subFolders.length === 0 && directRequests.length > 0) {
      flows.push({
        name: path.join(' > '),
        folder: { ...node, item: directRequests },
      });
    }

    for (const sub of subFolders) walk(sub, [...path, sub.name]);
  }

  walk(root, [root.name]);
  return flows;
}

// Deep-clone the collection and replace its top-level item[] with a single
// subset folder so newman runs only that flow. Preserves auth, events, variables.
function buildSubsetCollection(collection, exampleFolder, truncateAfter) {
  const clone = JSON.parse(JSON.stringify(collection));
  const subset = JSON.parse(JSON.stringify(exampleFolder));
  if (typeof truncateAfter === 'function' && Array.isArray(subset.item)) {
    subset.item = truncate(subset.item, truncateAfter);
  }
  clone.item = [subset];
  clone.info = { ...clone.info, name: `${clone.info?.name || 'Subset'} :: ${subset.name}` };
  return clone;
}

// Walk items (including nested folders) in order, keeping each up to and
// including the first one that matches `predicate`. Nested folders are
// pruned to only contain items up to the match if the match is inside them.
function truncate(items, predicate) {
  const out = [];
  let stopped = false;
  for (const it of items) {
    if (stopped) break;
    if (Array.isArray(it.item)) {
      const innerBefore = countLeaves(it.item);
      const inner = truncate(it.item, predicate);
      const innerAfter = countLeaves(inner);
      out.push({ ...it, item: inner });
      if (innerAfter < innerBefore) stopped = true;
      continue;
    }
    out.push(it);
    if (it.request && predicate(it)) { stopped = true; break; }
  }
  return out;
}

function countLeaves(items) {
  let n = 0;
  for (const it of items || []) {
    if (Array.isArray(it.item)) n += countLeaves(it.item);
    else if (it.request) n += 1;
  }
  return n;
}

function requestUrl(item) {
  const u = item?.request?.url;
  if (!u) return '';
  return typeof u === 'string' ? u : (u.raw || '');
}

function requestMethod(item) {
  return (item?.request?.method || 'GET').toUpperCase();
}

module.exports = {
  loadCollection,
  findFolder,
  enumerateFlows,
  buildSubsetCollection,
  requestUrl,
  requestMethod,
};
