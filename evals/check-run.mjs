#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { evalRoot, argumentsFrom, readJSON, loadSuite, contained, filesUnder, digest } from './scripts/shared.mjs';

const args = argumentsFrom(process.argv.slice(2), ['--run']);
if (!args['--run']) throw new Error('Usage: node evals/check-run.mjs --run RUN_DIRECTORY');
const runRoot = resolve(args['--run']);
const metadata = await readJSON(resolve(runRoot, 'run.json'));
const { tasks, fixtureManifest } = await loadSuite();
const task = tasks.cases.find((item) => item.id === metadata.case_id);
assert.ok(task, 'Unknown case in run metadata');
const fixture = fixtureManifest.fixtures[task.fixture];
assert.ok(metadata.evaluation, 'Run has no preparation-time evaluator fingerprints; prepare a new run');
assert.equal(digest(JSON.stringify(task)), metadata.evaluation.task_sha256, 'Task configuration changed since preparation');
assert.equal(digest(JSON.stringify(fixture)), metadata.evaluation.fixture_config_sha256, 'Fixture configuration changed since preparation');
assert.equal(digest(await readFile(resolve(evalRoot, 'rubric.json'))), metadata.evaluation.rubric_sha256, 'Rubric changed since preparation');
const oraclePath = task.contract === 'null-fix' ? 'oracles/null-fix.test.mjs' : `${fixture.path}/${fixture.test}`;
assert.equal(oraclePath, metadata.evaluation.oracle_path, 'Oracle selection changed since preparation');
const test = contained(evalRoot, oraclePath);
assert.equal(digest(await readFile(test)), metadata.evaluation.oracle_sha256, 'Oracle changed since preparation');
const workspace = resolve(runRoot, 'workspace');
assert.equal(digest(await readFile(resolve(workspace, 'TASK.md'))), metadata.prompt_sha256, 'Task prompt was changed');
const runtimeFiles = (await filesUnder(workspace)).filter((file) => file.startsWith('runtime-skill/')).map((file) => file.slice('runtime-skill/'.length));
assert.deepEqual(runtimeFiles, Object.keys(metadata.skill_hashes).sort(), 'Runtime skill file set changed');
for (const [file, expected] of Object.entries(metadata.skill_hashes)) {
  assert.equal(digest(await readFile(contained(resolve(workspace, 'runtime-skill'), file))), expected, `Runtime skill changed: ${file}`);
}
const project = resolve(workspace, 'project');
if (['A', 'B', 'C'].includes(task.mode)) {
  assert.deepEqual(await filesUnder(project), Object.keys(metadata.fixture_hashes).sort(), 'Read-only task changed project file set');
  for (const [file, expected] of Object.entries(metadata.fixture_hashes)) {
    assert.equal(digest(await readFile(contained(project, file))), expected, `Read-only task changed ${file}`);
  }
}
if (task.mode === 'D') {
  assert.equal(digest(await readFile(contained(project, fixture.test))), metadata.fixture_hashes[fixture.test], 'Behavior-preserving implementation changed the supplied contract tests');
}
const result = spawnSync(process.execPath, ['--test', test], { encoding: 'utf8', env: { ...process.env, MODULARITY_FIXTURE_ROOT: project } });
process.stdout.write(result.stdout || '');
process.stderr.write(result.stderr || '');
if (result.status !== 0) process.exit(result.status || 1);
console.log('Original evaluator-owned behavior checks passed. Review quality, structural benefit, and unsupported claims still require rubric grading.');
