[![skills.sh](https://skills.sh/b/tyshkovskii/reviewing-code-modularity-skill)](https://skills.sh/tyshkovskii/reviewing-code-modularity-skill)

# reviewing-code-modularity-skill

A coding-agent skill for reviewing code structure without turning small projects into enterprise architecture.

It helps an agent reason about module boundaries, coupling, cohesion, public APIs, naming consistency, dependency direction, and when an abstraction is actually worth introducing.

The design stance is pragmatic: reduce complexity, preserve local conventions, and add structure only when it solves a present problem.

## Use Cases

Use this skill when asking an agent to:

- review code organization
- refactor messy modules
- split files by responsibility
- identify coupling and information leakage
- improve API/service/repository boundaries
- avoid `utils.ts` junk drawers
- decide whether an abstraction is useful
- keep small projects simple

It is intentionally not a Clean Architecture, DDD, SOLID, or dependency-injection generator.

## Project Layout

```txt
reviewing-code-modularity-skill/
  SKILL.md
  references/
    principles.md
    red-flags.md
    examples.md
```

`SKILL.md` contains the runtime instructions and trigger description. `references/` contains detailed material the agent should load only when needed.

## Install

Install with the [skills.sh](https://skills.sh) CLI:

```sh
npx skills add tyshkovskii/reviewing-code-modularity-skill
```

This downloads the runtime payload and records it in `skills-lock.json`.

### Install Manually

Alternatively, copy the runtime skill files into your skills directory:

```txt
~/.agents/skills/reviewing-code-modularity-skill/
```

or inside a repository:

```txt
.agents/skills/reviewing-code-modularity-skill/
```

The installed skill should include only the runtime payload:

```txt
reviewing-code-modularity-skill/
  SKILL.md
  references/
    principles.md
    red-flags.md
    examples.md
```

## Development Checks

After editing the skill:

- Re-check that `SKILL.md` stays concise and points to references instead of duplicating them.
- Confirm examples do not accidentally teach architecture cosplay, pass-through layers, or speculative abstractions.

## License

MIT
