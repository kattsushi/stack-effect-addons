import { describe, expect, it } from "vitest";
import {
  createApplyArgv,
  createPreviewArgv,
  validateApplyReceipt,
  validatePreviewReceipt,
} from "../src/bootstrap-receipt.js";

const workspaceAlpha = "/synthetic/workspace-alpha";
const workspaceBeta = "/synthetic/workspace-beta";
const applyArgv = createApplyArgv(workspaceAlpha);
const previewArgv = createPreviewArgv(workspaceAlpha);
const approvedPreview = {
  argv: previewArgv,
  approved: true,
} as const;

describe("bootstrap receipt validation", () => {
  it("derives the ordered apply and preview argv from the supplied root", () => {
    expect(applyArgv).toEqual([
      "stack-effect",
      "init",
      ".",
      "--root",
      workspaceAlpha,
      "--runtime",
      "bun",
      "--typescript",
      "7",
      "--no-git",
    ]);
    expect(previewArgv).toEqual([...applyArgv, "--dry-run", "--show-files"]);
  });

  it("accepts receipts only for their exact supplied workspace root", () => {
    expect(validatePreviewReceipt(workspaceAlpha, previewArgv)).toEqual({
      ok: true,
    });
    expect(
      validateApplyReceipt(workspaceAlpha, applyArgv, approvedPreview),
    ).toEqual({ ok: true });

    expect(validatePreviewReceipt(workspaceBeta, previewArgv).ok).toBe(false);
    expect(
      validateApplyReceipt(workspaceBeta, applyArgv, approvedPreview).ok,
    ).toBe(false);
  });

  it("rejects changed, omitted, reordered, extra, and executable-drift argv", () => {
    const changed: string[] = [...previewArgv];
    changed[changed.indexOf("7")] = "6";
    expect(validatePreviewReceipt(workspaceAlpha, changed).ok).toBe(false);

    const omitted = previewArgv.filter((value) => value !== "--no-git");
    expect(validatePreviewReceipt(workspaceAlpha, omitted).ok).toBe(false);

    const reordered = [...applyArgv];
    [reordered[3], reordered[5]] = [reordered[5]!, reordered[3]!];
    expect(
      validateApplyReceipt(workspaceAlpha, reordered, approvedPreview).ok,
    ).toBe(false);

    expect(
      validatePreviewReceipt(workspaceAlpha, [...previewArgv, "unexpected"]).ok,
    ).toBe(false);

    const executableDrift: string[] = [...applyArgv];
    executableDrift[0] = "other-command";
    expect(
      validateApplyReceipt(workspaceAlpha, executableDrift, approvedPreview).ok,
    ).toBe(false);
  });

  it.each(["--yes", "--trust"])("rejects forbidden %s", (flag) => {
    expect(
      validatePreviewReceipt(workspaceAlpha, [...previewArgv, flag]).ok,
    ).toBe(false);
    expect(
      validateApplyReceipt(
        workspaceAlpha,
        [...applyArgv, flag],
        approvedPreview,
      ).ok,
    ).toBe(false);
  });

  it("rejects apply without an approved matching preview", () => {
    expect(validateApplyReceipt(workspaceAlpha, applyArgv).ok).toBe(false);
    expect(
      validateApplyReceipt(workspaceAlpha, applyArgv, {
        argv: previewArgv,
        approved: false,
      }).ok,
    ).toBe(false);

    const mismatchedPreview: string[] = [...previewArgv];
    mismatchedPreview[mismatchedPreview.indexOf("bun")] = "node";
    expect(
      validateApplyReceipt(workspaceAlpha, applyArgv, {
        argv: mismatchedPreview,
        approved: true,
      }).ok,
    ).toBe(false);
  });

  it("contains no command or process authority", () => {
    const implementation = [
      createApplyArgv,
      createPreviewArgv,
      validatePreviewReceipt,
      validateApplyReceipt,
    ]
      .map(String)
      .join("\n");
    expect(implementation).not.toMatch(
      /node:child_process|child_process|Bun\.spawn|\bprocess\b|shell|installer|hook/i,
    );
  });
});
