# Modularity skill evaluations

This is an executable starter suite, not a published benchmark result. It has 16 task cases backed by 12 small, self-contained Node fixtures. It tests review, scan, design, implementation, and a local bug-fix task that should not become an architecture exercise. No package downloads or API credentials are required to prepare or check a run.

Small fixtures make failures easy to inspect. They do not represent the ambiguity, scale, framework conventions, or maintenance history of a real repository. Credible claims of improvement require harder independent cases, repeated comparable model runs, and human review.

## Files and trust boundaries

| File | Purpose | Give to task agent? |
| --- | --- | --- |
| `evals.json` | Case identifiers, raw requests, input paths, modes and split | No; preparation extracts the request and input paths |
| `fixtures.json` | Fixture locations and executable contract names | No |
| `fixtures/` | Actual code, project context, visible behavior tests | Only the selected fixture |
| `rubric.json` | Quality expectations and failure conditions | No |
| `oracles/` | Desired behavior for the intentional null-profile defect | No |
| `prepare-run.mjs` | Creates one isolated workspace and runtime intervention | Evaluator only |
| `check-run.mjs` | Checks an actual run against original contracts and snapshots | Evaluator only |
| `verify.mjs` | Validates suite wiring and baseline fixtures | Evaluator only |
| `trigger-queries.json` | Separate positive/negative activation cases | Activation harness only |
| `results/` | Recorded experiments, when present | No |

Task prompts contain the user's request and the supplied input paths, without grading expectations. Prepared projects always live at `workspace/project`, rather than under diagnostic fixture names. Optional selected-candidate context is copied only for the task that requests it. Evaluator metadata remains outside the workspace. Skill payloads contain only `SKILL.md` and runtime `references/`, `scripts/`, and `assets/`; they exclude the evaluation suite.

The file boundary prevents accidental rubric loading. It is not an OS sandbox: configure the model harness so it cannot read the parent evaluation repository or sibling runs. Do not run the task agent in this repository with the rubric nearby, and do not fork an authoring conversation that has already read it.

## Verify the fixtures

Requirements: Node.js 22+ and Git. From the repository root:

```sh
node evals/verify.mjs
```

This validates:

- Case/rubric/input links and A/B/C/D coverage.
- Fixture-disjoint development and holdout splits.
- Every fixture's executable baseline contract.
- Applying the PR patch to the base snapshot reproduces the head snapshot.
- No-skill, pinned-current, and candidate workspace preparation.
- No evaluator files or unrelated selected-candidate context enter task workspaces.
- All arms receive the same raw task, the current skill is pinned, and existing run directories cannot be reused.

These are deterministic fixture and harness checks. Passing them is **not** evidence that an agent followed the skill, produced a useful review, or improved over a baseline.

## Cases

| Case | Mode | Split | Decision tested |
| --- | --- | --- | --- |
| `private-forwarder` | A | Development | Private indirection: optional modest cleanup or justified no action |
| `public-forwarder` | A | Holdout | Preserve a supported public compatibility wrapper |
| `shared-delivery-policy` | A | Development | Consolidate one policy with coordinated change history |
| `similar-labels` | A | Holdout | Preserve independently owned, similar-looking behavior |
| `cohesive-parser` | A | Development | Avoid splitting a cohesive grammar by size or appearance |
| `signup-review` | A | Development | Identify transport versus reusable signup responsibility |
| `signup-scan` | B | Development | Prioritize supported candidates without padding |
| `signup-selected-design` | C | Development | Carry selected-candidate context into an API design |
| `clock-seam` | C | Development | Support a justified seam with one production implementation |
| `pure-function-seam` | C | Holdout | Avoid a factory/interface around an already testable pure function |
| `public-import` | A | Development | Recognize an intended public dependency |
| `internal-import` | A | Development | Detect leaked representation and filtering policy |
| `respect-adr` | C | Development | Reconcile a proposal with a real accepted ADR |
| `pr-introduced-vs-existing` | A | Holdout | Separate newly introduced and unchanged pre-existing issues |
| `implement-shared-order-operation` | D | Development | Refactor with outputs, errors, and effects preserved |
| `local-null-fix` | Outside skill scope | Holdout | Fix the bug locally without architectural expansion |

The parser is intentionally compact; no task pretends it contains hundreds of lines. The PR case uses explicitly labeled before/after snapshots and a real applicable patch, not fabricated commit hashes. For live repository evaluations, pin actual base/head commits and use the intended merge-base policy separately.

## Prepare three comparable arms

Use a fresh output directory for every case, arm, and repetition. Output may be anywhere outside the source checkout; these examples use `/tmp`.

```sh
node evals/prepare-run.mjs --case implement-shared-order-operation --arm no-skill --output /tmp/modularity-run-01

node evals/prepare-run.mjs --case implement-shared-order-operation --arm current --skill-ref 018b4d66d5e879e447654076cab7dadf935fee87 --output /tmp/modularity-run-02

node evals/prepare-run.mjs --case implement-shared-order-operation --arm candidate --output /tmp/modularity-run-03
```

The example current ref is the repository revision reviewed before this upgrade. It must be present in the local Git history. For another baseline, supply its exact commit. `--skill-repo PATH` supports a separate checkout with that history. `--skill-dir PATH` supplies an alternate candidate directory. `--replicate 2` records another repetition; it does not itself execute or seed a model.

Preparation produces:

```text
run-directory/
  run.json                    evaluator-only arm, hashes, revision, repetition
  workspace/                  the task agent's entire accessible workspace
    TASK.md                   request and supplied-file paths
    project/                  isolated fixture copy
    runtime-skill/             current/candidate only
      SKILL.md
      references/...
```

Give a **fresh-context** agent only `workspace/TASK.md` and access to `workspace/`. Do not send the case name, split, rubric, evaluation rationale, other runs, or expected outcome. In current/candidate arms, the prompt explicitly requests the supplied skill. This measures quality **conditional on invocation**; it does not test autonomous activation. The no-skill arm receives the same raw task without that intervention.

Model execution is intentionally manual/harness-neutral. Record the exact model version, harness/version, settings, tools, limits, start/end time, token use when exposed, raw response, full tool trace, final files/diff, and any interruptions outside `workspace/`. If a metric is unavailable, record that fact rather than estimating it. Keep the runtime skill snapshot and task prompt immutable.

## Check a completed run

```sh
node evals/check-run.mjs --run /tmp/modularity-run-03
```

The checker verifies unchanged task/skill fingerprints and rejects drift in the evaluator's task configuration, fixture configuration, rubric, or original oracle since preparation. Restore the pinned evaluation revision to grade an older run; do not silently grade it with today's changed rubric. Review, scan, and design cases must leave project files unchanged. The implementation case must preserve its supplied contract tests. It then runs the **original evaluator-owned test file** against the run's edited project, so changing a test in the agent workspace cannot hide a regression.

The order-flow contract covers both public entry points, exact output shapes, validation error name/message, no side effects for empty/non-array/invalid-price input, save-before-receipt order, identity-preserving propagation of save/send errors, no compensation on send failure, and non-mutation of input. It does not dictate a new filename or helper signature. A refactor must also be reviewed for actual consolidation: merely passing behavior tests does not prove structural improvement.

The null-profile fixture deliberately contains a known bug. Its passing baseline test characterizes that bug; the task asks the agent to replace that expectation with desired behavior. `check-run.mjs` uses a separate original desired-behavior oracle, so an unmodified null-profile run correctly fails post-task checking. This exception does not permit other cases to rewrite contracts.

## Repeated, held-out comparison protocol

1. **Freeze the experiment.** Pin current and candidate skill contents, fixture/rubric revision, and model/harness configuration. Save preparation hashes. Define the primary comparison and acceptance criteria before reading candidate results.
2. **Use development cases for iteration.** Start with the failure you are addressing; compare no-skill/current/candidate in isolated contexts. Inspect all outputs and failed evidence claims. Do not optimize only for a composite score.
3. **Keep holdout families separate.** A fixture cannot be development in one case and holdout in another; `verify.mjs` checks this. Once holdout results inform a rewrite, those cases are development data for the next revision. Add new independent holdouts before another improvement claim.
4. **Pair conditions and repeat.** Use the same task, tools, time/token limits, model, and surrounding instructions. Randomize arm order within each case/repetition. Start with at least three repetitions per arm for exploratory measurements; report the small sample and expand when variability prevents a decision. A single smoke pass is not a benchmark.
5. **Grade evidence and behavior.** Run `check-run.mjs`, then grade the response and tool trace with `rubric.json`. Check that cited locations exist, the claimed mechanism is present, the proposed fix preserves contracts, and review scope is respected. Do not pass a response merely for mentioning the expected phrase or a required heading.
6. **Blind the quality comparison.** Give graders outputs labeled A/B/C in randomized order, with the task and original project context. Keep arm/version identifiers out of the grading view; preserve raw originals elsewhere. Check both current-versus-candidate and no-skill-versus-candidate. Human review decides ambiguous tradeoffs, especially optional small cleanups.
7. **Report distributions and failures.** Report supported useful findings, false findings, missed material findings, harmful recommendations, behavior regressions, and scope violations. Keep severity calibration and evidence strength separate. Include per-case outcomes, pass counts/denominators, token/time distributions, and run-to-run variation. Do not call a self-reported confidence number a probability.
8. **Choose the cheaper sufficient procedure.** Adopt a revision only when its benefit survives held-out checks without unacceptable new failures or cost. A tied result may justify simplification, but does not establish quality uplift. Preserve unsuccessful experiments and rollback reasons.

The starter holdout is small and cannot support broad claims about all codebases. Extend it with anonymized real changes, defensible no-change cases, disagreements settled by maintainers, and defects that depend on callers outside the immediate diff. Keep expected decisions justified by repository evidence, rather than by the skill's own wording.

## Activation is a separate experiment

`trigger-queries.json` contains positive and near-miss negative requests. Test it using the real harness's skill discovery mechanism: supply the normal skill registry and project context, without telling the agent to invoke this skill. Record whether the skill was actually loaded, not whether its name appeared in the final answer.

Measure false triggers and missed triggers separately from review quality. Keep fixture-backed output cases for substantive work; do not infer activation accuracy from `prepare-run.mjs`, which intentionally forces the skill intervention. Changes to model, registry size, descriptions, or repository instructions can change activation behavior and deserve their own rerun.
