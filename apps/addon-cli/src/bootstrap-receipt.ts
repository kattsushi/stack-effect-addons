export const createApplyArgv = (workspaceRoot: string) =>
  [
    "stack-effect",
    "init",
    ".",
    "--root",
    workspaceRoot,
    "--runtime",
    "bun",
    "--typescript",
    "7",
    "--no-git",
  ] as const;

export const createPreviewArgv = (workspaceRoot: string) =>
  [...createApplyArgv(workspaceRoot), "--dry-run", "--show-files"] as const;

export interface PreviewReceipt {
  readonly argv: readonly string[];
  readonly approved: boolean;
}

export type ReceiptValidation =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: string };

const matches = (actual: readonly string[], expected: readonly string[]) =>
  actual.length === expected.length &&
  actual.every((value, index) => value === expected[index]);

export const validatePreviewReceipt = (
  workspaceRoot: string,
  argv: readonly string[],
): ReceiptValidation =>
  matches(argv, createPreviewArgv(workspaceRoot))
    ? { ok: true }
    : { ok: false, reason: "preview argv must match exactly" };

export const validateApplyReceipt = (
  workspaceRoot: string,
  argv: readonly string[],
  preview?: PreviewReceipt,
): ReceiptValidation => {
  if (!matches(argv, createApplyArgv(workspaceRoot))) {
    return { ok: false, reason: "apply argv must match exactly" };
  }
  if (
    preview?.approved !== true ||
    !matches(preview.argv, createPreviewArgv(workspaceRoot))
  ) {
    return {
      ok: false,
      reason: "apply requires an approved matching preview",
    };
  }
  return { ok: true };
};
