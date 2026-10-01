import { readFile, readdir, lstat, mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

export const evalRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const repoRoot = resolve(evalRoot, '..');
export const readJSON = async (file) => JSON.parse(await readFile(file, 'utf8'));
export const digest = (content) => createHash('sha256').update(content).digest('hex');

export function contained(root, child) {
  if (typeof child !== 'string' || !child || child.includes('\\')) throw new Error(`Invalid relative path: ${child}`);
  const result = resolve(root, child);
  const rel = relative(root, result);
  if (!rel || rel.startsWith(`..${sep}`) || rel === '..' || resolve(child) === child) {
    throw new Error(`Path must name a file or directory inside its root: ${child}`);
  }
  return result;
}

export async function filesUnder(root, prefix = '') {
  const result = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const name = prefix ? `${prefix}/${entry.name}` : entry.name;
    const full = resolve(root, entry.name);
    const stat = await lstat(full);
    if (stat.isSymbolicLink()) throw new Error(`Symlinks are not allowed in evaluation payloads: ${name}`);
    if (stat.isDirectory()) result.push(...await filesUnder(full, name));
    else if (stat.isFile()) result.push(name);
    else throw new Error(`Unsupported fixture entry: ${name}`);
  }
  return result.sort();
}

export async function copyFiles(source, destination, files) {
  const hashes = {};
  for (const file of files) {
    const content = await readFile(contained(source, file));
    const target = contained(destination, file);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content);
    hashes[file] = digest(content);
  }
  return hashes;
}

export function argumentsFrom(argv, allowed) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (!allowed.includes(flag) || !argv[i + 1] || argv[i + 1].startsWith('--')) {
      throw new Error(`Expected one of ${allowed.join(', ')} followed by a value; received ${flag}`);
    }
    if (flag in args) throw new Error(`Duplicate option: ${flag}`);
    args[flag] = argv[++i];
  }
  return args;
}

export async function loadSuite() {
  const [tasks, fixtureManifest, rubric] = await Promise.all([
    readJSON(resolve(evalRoot, 'evals.json')),
    readJSON(resolve(evalRoot, 'fixtures.json')),
    readJSON(resolve(evalRoot, 'rubric.json')),
  ]);
  return { tasks, fixtureManifest, rubric };
}

export function isRuntimeFile(path) {
  return path === 'SKILL.md' || /^(references|scripts|assets)\//.test(path);
}
