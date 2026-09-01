# Bootstrap receipt

## Pinned source and selections

The bootstrap oracle is Stack Effect core HEAD `437ed2b7010d8b879381da3554c76642443d96fe`.
The interactive selections were Vite+, Oxlint, Oxfmt, and Vitest on the Bun and TypeScript 7 lane.

## Preview before apply

The caller supplies the exact workspace root to each validator. The approved preview argv is exactly:

```text
stack-effect init . --root <workspace-root> --runtime bun --typescript 7 --no-git --dry-run --show-files
```

Apply is permitted only after explicit approval of that matching preview. Its argv is exactly the same base argv with `--dry-run` and `--show-files` removed:

```text
stack-effect init . --root <workspace-root> --runtime bun --typescript 7 --no-git
```

`--yes` and `--trust` are forbidden for both receipts. Changed, omitted, reordered, or additional arguments invalidate a receipt, as does executable drift, a different supplied workspace root, preview/apply drift, or missing approval linkage.

## Approved bootstrap effects

The exact approved Finalize list was:

1. `bun install`
2. `bun run lint`
3. `bun run format`

The preview's file list was authoritative except for the explicitly approved core-owned `stack.effect.json` exception. That file remains core-owned and is not an addon write surface.

## Validator authority

Receipt validation is a pure comparison of caller-provided values. It executes no command, process, shell, installer, hook, Finalize action, or bootstrap operation. Running the validator is not authorization to run either recorded command.
