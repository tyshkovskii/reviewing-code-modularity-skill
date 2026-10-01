#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile, writeFile, lstat, mkdtemp, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { evalRoot, repoRoot, loadSuite, contained, filesUnder, copyFiles, readJSON } from './scripts/shared.mjs';

const { tasks, fixtureManifest, rubric } = await loadSuite();
assert.equal(tasks.schema_version, 1);
assert.equal(fixtureManifest.schema_version, 1);
assert.equal(rubric.schema_version, 1);
assert.ok(Array.isArray(tasks.cases) && tasks.cases.length >= 1);
const seen = new Set();
const modes = new Set();
for (const item of tasks.cases) {
  assert.ok(item.id && !seen.has(item.id), `Duplicate/missing case: ${item.id}`);
  seen.add(item.id); modes.add(item.mode);
  assert.ok(['A', 'B', 'C', 'D', 'none'].includes(item.mode), `Unknown mode: ${item.mode}`);
  assert.ok(['development', 'holdout'].includes(item.split), `Unknown split: ${item.split}`);
  assert.ok(['fixture', 'null-fix'].includes(item.contract), `Unknown contract: ${item.contract}`);
  assert.ok(typeof item.request === 'string' && item.request.length > 20, `Missing request: ${item.id}`);
  assert.ok(!('expected_output' in item) && !('expectations' in item), 'Grading expectations belong only in rubric.json');
  const fixture = fixtureManifest.fixtures[item.fixture];
  assert.ok(fixture, `Missing fixture: ${item.fixture}`);
  const root = contained(evalRoot, fixture.path);
  for (const file of item.files) assert.ok((await lstat(contained(root, file))).isFile(), `Missing input ${item.id}/${file}`);
  const grade = rubric.cases[item.id];
  assert.equal(grade?.expected_mode, item.mode, `Rubric mode mismatch: ${item.id}`);
  assert.ok(grade.expectations?.length && grade.failure_conditions?.length, `Incomplete rubric: ${item.id}`);
}
assert.deepEqual(Object.keys(rubric.cases).sort(), [...seen].sort(), 'Rubric cases must match task cases');
for (const mode of ['A', 'B', 'C', 'D']) assert.ok(modes.has(mode), `No cases for mode ${mode}`);
assert.ok(tasks.cases.some((item) => item.split === 'holdout'));
for (const fixture of Object.keys(fixtureManifest.fixtures)) {
  const splits = new Set(tasks.cases.filter((item) => item.fixture === fixture).map((item) => item.split));
  assert.equal(splits.size, 1, `Fixture ${fixture} is unused or crosses development/holdout split`);
}

let fixtureCount = 0;
for (const [name, fixture] of Object.entries(fixtureManifest.fixtures)) {
  const root = contained(evalRoot, fixture.path);
  const files = await filesUnder(root); // Also rejects symlink escapes.
  assert.ok(files.includes(fixture.test), `Missing executable contract: ${name}`);
  for (const file of fixture.optional_context || []) assert.ok(files.includes(file));
  const result = spawnSync(process.execPath, ['--test', fixture.test], { cwd: root, encoding: 'utf8', env: { ...process.env, MODULARITY_FIXTURE_ROOT: root } });
  if (result.status !== 0) throw new Error(`Fixture ${name} failed:\n${result.stdout}\n${result.stderr}`);
  fixtureCount++;
}

// Check the supplied patch against its before snapshot, then compare every after file.
const prRoot = contained(evalRoot, fixtureManifest.fixtures['catalog-change'].path);
const pr = await readJSON(resolve(prRoot, 'pr.json'));
assert.equal(pr.baseline_kind, 'snapshot');
assert.deepEqual(pr.changed_files, ['export.mjs']);
const patchWorkspace = await mkdtemp(join(tmpdir(), 'modularity-patch-'));
try {
  const before = contained(prRoot, pr.base);
  const after = contained(prRoot, pr.head);
  await copyFiles(before, patchWorkspace, await filesUnder(before));
  execFileSync('git', ['apply', contained(prRoot, pr.patch)], { cwd: patchWorkspace, stdio: 'pipe' });
  assert.deepEqual(await filesUnder(patchWorkspace), await filesUnder(after), 'Patch file set differs from head snapshot');
  for (const file of await filesUnder(after)) assert.equal(await readFile(resolve(patchWorkspace, file), 'utf8'), await readFile(resolve(after, file), 'utf8'), `Patch mismatch: ${file}`);
} finally { await rm(patchWorkspace, { recursive: true, force: true }); }

// Exercise preparation and verify that evaluator-only data is absent from task roots.
const prepRoot = await mkdtemp(join(tmpdir(), 'modularity-prepare-'));
try {
  const disallowed = spawnSync(process.execPath, [resolve(evalRoot, 'prepare-run.mjs'), '--case', 'signup-review', '--arm', 'candidate', '--output', resolve(evalRoot, 'fixtures/rejected-run')], { encoding: 'utf8' });
  assert.notEqual(disallowed.status, 0, 'Preparation accepted an output inside its source');
  assert.ok(disallowed.stderr.includes('--output must be outside'), 'Expected source-contamination rejection');
  const pinnedCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  const rawPromptHashes = new Set();
  for (const arm of ['no-skill', 'current', 'candidate']) {
    const output = resolve(prepRoot, arm);
    const command = [resolve(evalRoot, 'prepare-run.mjs'), '--case', 'signup-review', '--arm', arm, '--output', output];
    if (arm === 'current') command.push('--skill-ref', pinnedCommit);
    execFileSync(process.execPath, command, { stdio: 'pipe' });
    const workspace = resolve(output, 'workspace');
    const files = await filesUnder(workspace);
    assert.ok(!files.some((file) => /(^|\/)(evals|rubric\.json|run\.json|selected-candidate\.md)(\/|$)/.test(file)), 'Evaluation metadata or irrelevant selected-candidate context leaked');
    assert.equal(files.includes('runtime-skill/SKILL.md'), arm !== 'no-skill');
    const prompt = await readFile(resolve(workspace, 'TASK.md'), 'utf8');
    assert.ok(!prompt.includes('signup-review') && !prompt.includes('fixtures/signup-route'), 'Diagnostic case/fixture identifier leaked in task prompt');
    const metadata = await readJSON(resolve(output, 'run.json'));
    rawPromptHashes.add(metadata.request_sha256);
    if (arm === 'current') {
      assert.equal(metadata.skill_commit, pinnedCommit);
      assert.equal(await readFile(resolve(workspace, 'runtime-skill/SKILL.md'), 'utf8'), execFileSync('git', ['show', `${pinnedCommit}:SKILL.md`], { cwd: repoRoot, encoding: 'utf8' }));
    }
    const reused = spawnSync(process.execPath, command, { encoding: 'utf8' });
    assert.notEqual(reused.status, 0, 'Preparation must reject existing output directories');
    assert.deepEqual(await readJSON(resolve(output, 'run.json')), metadata, 'Overwrite rejection changed run metadata');
    execFileSync(process.execPath, [resolve(evalRoot, 'check-run.mjs'), '--run', output], { stdio: 'pipe' });
    if (arm === 'candidate') {
      // Simulate an older prepared run without changing the shared suite itself.
      for (const [field, message] of [['task_sha256', 'Task configuration changed'], ['oracle_sha256', 'Oracle changed']]) {
        const stale = structuredClone(metadata);
        stale.evaluation[field] = '0'.repeat(64);
        await writeFile(resolve(output, 'run.json'), JSON.stringify(stale));
        const checked = spawnSync(process.execPath, [resolve(evalRoot, 'check-run.mjs'), '--run', output], { encoding: 'utf8' });
        assert.notEqual(checked.status, 0, `Checker accepted stale ${field}`);
        assert.ok(checked.stderr.includes(message), `Unexpected drift rejection: ${checked.stderr}`);
      }
      await writeFile(resolve(output, 'run.json'), JSON.stringify(metadata, null, 2) + '\n');
    }
  }
  assert.equal(rawPromptHashes.size, 1, 'All arms must receive the same raw task');
} finally { await rm(prepRoot, { recursive: true, force: true }); }

console.log(`Verified ${tasks.cases.length} task/rubric links, ${fixtureCount} executable fixture contracts, PR patch consistency, and isolated preparation.`);
console.log('These checks validate fixture correctness and harness wiring. They do not measure agent performance or demonstrate skill improvement.');
