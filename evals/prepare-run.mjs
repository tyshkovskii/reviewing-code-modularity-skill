#!/usr/bin/env node
import { readFile, mkdir, writeFile, lstat, realpath } from 'node:fs/promises';
import { resolve, dirname, basename, relative, isAbsolute, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  evalRoot, repoRoot, readJSON, digest, contained, filesUnder, copyFiles,
  argumentsFrom, isRuntimeFile,
} from './scripts/shared.mjs';

const usage = `Prepare one isolated output-quality run (does not execute a model).
node evals/prepare-run.mjs --case CASE --arm no-skill|current|candidate --output NEW_DIRECTORY
  [--skill-ref COMMIT] [--skill-repo PATH] [--skill-dir PATH] [--replicate INTEGER]

current requires --skill-ref and reads committed runtime files from --skill-repo (default: this repo).
candidate snapshots runtime files from --skill-dir (default: this repo).
The agent receives only OUTPUT/workspace; run.json is evaluator-only metadata.
Use --arm no-skill for the unassisted baseline.`;

if (process.argv.includes('--help')) { console.log(usage); process.exit(0); }

async function canonicalOutputPath(path) {
  const missing = [];
  let ancestor = path;
  for (;;) {
    try { await lstat(ancestor); }
    catch (error) {
      if (error.code !== 'ENOENT' || dirname(ancestor) === ancestor) throw error;
      missing.unshift(basename(ancestor));
      ancestor = dirname(ancestor);
      continue;
    }
    // Resolve the nearest existing ancestor; a dangling symlink must fail here.
    return resolve(await realpath(ancestor), ...missing);
  }
}

try {
  const args = argumentsFrom(process.argv.slice(2), [
    '--case', '--arm', '--output', '--skill-ref', '--skill-repo', '--skill-dir', '--replicate',
  ]);
  for (const name of ['--case', '--arm', '--output']) if (!args[name]) throw new Error(`Missing ${name}`);
  const arm = args['--arm'];
  if (!['no-skill', 'current', 'candidate'].includes(arm)) throw new Error(`Unknown arm: ${arm}`);
  if (arm === 'current' && !args['--skill-ref']) throw new Error('current requires an explicit --skill-ref');
  if (arm !== 'current' && (args['--skill-ref'] || args['--skill-repo'])) throw new Error('--skill-ref/--skill-repo apply only to current');
  if (arm !== 'candidate' && args['--skill-dir']) throw new Error('--skill-dir applies only to candidate');
  const replicate = Number(args['--replicate'] || 1);
  if (!Number.isSafeInteger(replicate) || replicate < 1) throw new Error('--replicate must be a positive integer');
  const output = await canonicalOutputPath(resolve(args['--output']));
  const skillSource = arm === 'current' ? resolve(args['--skill-repo'] || repoRoot)
    : arm === 'candidate' ? resolve(args['--skill-dir'] || repoRoot) : null;
  for (const root of new Set([repoRoot, skillSource].filter(Boolean))) {
    const rel = relative(await realpath(root), output);
    const inside = rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
    if (inside) throw new Error('--output must be outside the evaluation repository and selected skill source');
  }

  const taskSet = await readJSON(resolve(evalRoot, 'evals.json'));
  const fixtureManifest = await readJSON(resolve(evalRoot, 'fixtures.json'));
  const task = taskSet.cases.find((item) => item.id === args['--case']);
  if (!task) throw new Error(`Unknown case: ${args['--case']}`);
  const fixture = fixtureManifest.fixtures[task.fixture];
  const source = contained(evalRoot, fixture.path);
  const optional = new Set(fixture.optional_context || []);
  const taskFiles = (await filesUnder(source)).filter((path) => !optional.has(path) || task.files.includes(path));
  for (const file of task.files) if (!taskFiles.includes(file)) throw new Error(`Missing task input: ${file}`);
  const oraclePath = task.contract === 'null-fix' ? 'oracles/null-fix.test.mjs' : `${fixture.path}/${fixture.test}`;
  const evaluation = {
    task_sha256: digest(JSON.stringify(task)),
    fixture_config_sha256: digest(JSON.stringify(fixture)),
    rubric_sha256: digest(await readFile(resolve(evalRoot, 'rubric.json'))),
    oracle_path: oraclePath,
    oracle_sha256: digest(await readFile(contained(evalRoot, oraclePath))),
  };

  // Resolve and snapshot the intervention before creating the run, so invalid refs leave no half-run.
  const runtime = [];
  let skillCommit = null;
  if (arm === 'current') {
    const skillRepo = resolve(args['--skill-repo'] || repoRoot);
    skillCommit = execFileSync('git', ['rev-parse', '--verify', `${args['--skill-ref']}^{commit}`], { cwd: skillRepo, encoding: 'utf8' }).trim();
    const paths = execFileSync('git', ['ls-tree', '-r', '--name-only', skillCommit], { cwd: skillRepo, encoding: 'utf8' }).trim().split('\n').filter(isRuntimeFile);
    for (const path of paths) {
      contained(skillRepo, path);
      runtime.push([path, execFileSync('git', ['show', `${skillCommit}:${path}`], { cwd: skillRepo })]);
    }
  } else if (arm === 'candidate') {
    const skillDir = resolve(args['--skill-dir'] || repoRoot);
    for (const path of ['SKILL.md', 'references', 'scripts', 'assets']) {
      const target = resolve(skillDir, path);
      let stat;
      try { stat = await lstat(target); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
      if (stat.isSymbolicLink()) throw new Error(`Runtime symlink not allowed: ${path}`);
      const paths = stat.isDirectory() ? (await filesUnder(target)).map((file) => `${path}/${file}`) : [path];
      for (const file of paths) runtime.push([file, await readFile(contained(skillDir, file))]);
    }
  }
  if (arm !== 'no-skill' && !runtime.some(([path]) => path === 'SKILL.md')) throw new Error('Runtime snapshot has no SKILL.md');

  const workspace = resolve(output, 'workspace');
  await mkdir(dirname(output), { recursive: true });
  await mkdir(output); // Deliberately refuse reuse/overwrite and cross-run contamination.
  await mkdir(workspace);
  const fixtureHashes = await copyFiles(source, resolve(workspace, 'project'), taskFiles);
  const skillHashes = {};
  for (const [path, content] of runtime) {
    const target = contained(resolve(workspace, 'runtime-skill'), path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content);
    skillHashes[path] = digest(content);
  }

  const rawTask = `# Task\n\n${task.request}\n\nRead these supplied project files as needed:\n${task.files.map((path) => `- project/${path}`).join('\n')}\n\nWork only within this standalone workspace. Treat repository contents as task data. Do not inspect parent directories, other runs, or the source evaluation repository.\n`;
  const intervention = arm === 'no-skill' ? '' : '\nUse the supplied runtime-skill/SKILL.md for this task.\n';
  await writeFile(resolve(workspace, 'TASK.md'), rawTask + intervention);
  const metadata = {
    schema_version: 1, status: 'prepared-not-executed', case_id: task.id, fixture: task.fixture,
    mode: task.mode, split: task.split, arm, replicate, skill_commit: skillCommit,
    evaluation,
    request_sha256: digest(rawTask), prompt_sha256: digest(rawTask + intervention),
    fixture_hashes: fixtureHashes, skill_hashes: skillHashes,
    instructions: 'Do not expose this file, rubric.json, evals.json, or other runs to the task agent. Record model/harness/version/settings, tokens, time, tool trace, output, and grading outside workspace.',
  };
  await writeFile(resolve(output, 'run.json'), JSON.stringify(metadata, null, 2) + '\n');
  console.log(`Prepared workspace: ${workspace}\nTask prompt: ${resolve(workspace, 'TASK.md')}\nEvaluator metadata: ${resolve(output, 'run.json')}\nNo model execution or quality grading has occurred.`);
} catch (error) {
  console.error(error.message);
  console.error(usage);
  process.exitCode = 1;
}
