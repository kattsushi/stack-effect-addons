import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cwd = fileURLToPath(new URL("..", import.meta.url));

type Result = {
  code: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
};

const runCli = (args: ReadonlyArray<string>): Promise<Result> =>
  new Promise((resolve, reject) => {
    const env = { ...process.env };
    delete env.DEVTOOLS;
    Object.assign(env, {
      DEVTOOLS_URL: "ws://127.0.0.1:1",
      FORCE_COLOR: "0",
      NO_COLOR: "1",
    });

    const child = spawn("bun", ["run", "src/index.ts", ...args], {
      cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let settled = false;

    child.stdout.setEncoding("utf8").on("data", (chunk) => (stdout += chunk));
    child.stderr.setEncoding("utf8").on("data", (chunk) => (stderr += chunk));

    const timer = setTimeout(() => {
      child.kill();
      if (!settled) {
        settled = true;
        reject(
          new Error(
            `CLI timed out: ${args.join(" ")}\nstdout: ${stdout}\nstderr: ${stderr}`,
          ),
        );
      }
    }, 5_000);

    child.on("error", (error) => {
      clearTimeout(timer);
      if (!settled) {
        settled = true;
        reject(error);
      }
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      if (!settled) {
        settled = true;
        resolve({ code, signal, stdout, stderr });
      }
    });
  });

describe("stack-effect-addon CLI", () => {
  it("exposes hello without a receipt command", async () => {
    const result = await runCli(["--help"]);

    expect(result.code).toBe(0);
    expect(result.signal).toBeNull();
    expect(result.stdout).toMatch(/\bstack-effect-addon\b/i);
    expect(result.stdout).toMatch(/\bhello\b/i);
    expect(result.stdout).not.toMatch(/\breceipt\b/i);
    expect(result.stderr).toBe("");
  });

  it.each([
    { args: ["hello"], output: "Hello, World!\n" },
    { args: ["hello", "Ada"], output: "Hello, Ada!\n" },
    { args: ["hello", "Ada", "--shout"], output: "HELLO, ADA!\n" },
  ])(
    "preserves generated Hello behavior for $args",
    async ({ args, output }) => {
      const result = await runCli(args);

      expect(result).toEqual({
        code: 0,
        signal: null,
        stdout: output,
        stderr: "",
      });
    },
  );
});
