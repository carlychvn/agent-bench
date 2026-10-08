import type { BenchmarkTaskInput } from "./types";

export function validateBenchmarkTask(spec: BenchmarkTaskInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!spec.title.trim() || spec.title.length > 200)
    errors.title = "Enter a title of 1–200 characters.";
  try {
    const url = new URL(spec.repository_url);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "github.com" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      (url.port && url.port !== "443") ||
      !/^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/.test(url.pathname)
    )
      throw new Error();
  } catch {
    errors.repository_url = "Use https://github.com/owner/repository.";
  }
  for (const field of ["base_commit", "reference_commit"] as const) {
    if (!/^[a-f0-9]{40}$/.test(spec[field]))
      errors[field] = "Enter a full 40-character commit SHA.";
  }
  if (spec.base_commit === spec.reference_commit)
    errors.reference_commit = "Choose a different reference commit.";
  if (!spec.prompt.trim() || spec.prompt.length > 50_000)
    errors.prompt = "Enter a task prompt of 1–50,000 characters.";
  if (
    !spec.grading_paths.length ||
    spec.grading_paths.length > 100 ||
    spec.grading_paths.some(
      (path) =>
        path.split("/").some((part) => ["", ".", "..", ".git"].includes(part.toLowerCase())) ||
        /[\\\x00:*?\[\]]/.test(path),
    ) ||
    new Set(spec.grading_paths).size !== spec.grading_paths.length ||
    spec.grading_paths.some((a) => spec.grading_paths.some((b) => a !== b && b.startsWith(`${a}/`)))
  ) {
    errors.grading_paths =
      "List unique repository-relative test/fixture paths without globs, traversal or overlapping directories.";
  }
  if (
    !spec.fail_to_pass.length ||
    spec.fail_to_pass.length > 1000 ||
    new Set(spec.fail_to_pass).size !== spec.fail_to_pass.length
  )
    errors.fail_to_pass = "List 1–1,000 unique tests that must fail on base and pass on reference.";
  if (
    spec.pass_to_pass.length > 1000 ||
    new Set(spec.pass_to_pass).size !== spec.pass_to_pass.length ||
    spec.pass_to_pass.some((id) => spec.fail_to_pass.includes(id))
  )
    errors.pass_to_pass = "Use unique regression test IDs that are separate from the fix tests.";
  if (
    !spec.test_command.length ||
    spec.test_command.length > 100 ||
    spec.test_command.some((part) => !part.trim())
  )
    errors.test_command = "Supply an executable and up to 99 non-empty arguments.";
  if (!/^[^\s@]+@sha256:[a-f0-9]{64}$/.test(spec.environment.image))
    errors.image = "Pin the runtime image as repository@sha256:<64-character digest>.";
  return errors;
}

export function parseSetupCommands(text: string): string[][] {
  const value: unknown = JSON.parse(text);
  if (
    !Array.isArray(value) ||
    value.length > 20 ||
    !value.every(
      (command) =>
        Array.isArray(command) &&
        command.length > 0 &&
        command.length <= 100 &&
        command.every((argument: unknown) => typeof argument === "string" && argument.trim()),
    )
  ) {
    throw new Error("Use a JSON array of command argument arrays, with up to 20 commands.");
  }
  return value.map((command: string[]) => command.map((argument) => argument.trim()));
}
