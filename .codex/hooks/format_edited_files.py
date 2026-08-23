#!/usr/bin/env python3
"""Format files changed by apply_patch and lint tokens after TSX edits."""

import json
from pathlib import Path
import shutil
import subprocess
import sys
from typing import Optional


PRETTIER_SUFFIXES = {
    ".css",
    ".graphql",
    ".html",
    ".js",
    ".json",
    ".jsx",
    ".md",
    ".mdx",
    ".mjs",
    ".scss",
    ".ts",
    ".tsx",
    ".yaml",
    ".yml",
}
PATCH_MARKERS = ("*** Add File: ", "*** Update File: ", "*** Move to: ")


def warning(message: str) -> None:
    print(json.dumps({"systemMessage": message}))


def find_node(pnpm: Optional[str]) -> Optional[str]:
    node = shutil.which("node")
    if node:
        return node
    if pnpm:
        candidate = Path(pnpm).resolve().parents[2] / "node" / "bin" / "node"
        if candidate.is_file():
            return str(candidate)
    return None


def main() -> None:
    payload = json.load(sys.stdin)
    tool_input = payload.get("tool_input") or {}
    patch = tool_input.get("command") or ""
    cwd = Path(payload.get("cwd") or ".").resolve()

    try:
        root_text = subprocess.check_output(
            ["git", "rev-parse", "--show-toplevel"], cwd=cwd, text=True
        ).strip()
    except (OSError, subprocess.CalledProcessError):
        print("{}")
        return

    root = Path(root_text).resolve()
    paths: list[Path] = []
    for line in patch.splitlines():
        for marker in PATCH_MARKERS:
            if not line.startswith(marker):
                continue
            candidate = (root / line[len(marker) :].strip()).resolve()
            if candidate == root or root not in candidate.parents:
                break
            if candidate.is_file() and candidate.suffix.lower() in PRETTIER_SUFFIXES:
                paths.append(candidate)
            break

    paths = list(dict.fromkeys(paths))
    if not paths:
        print("{}")
        return

    pnpm = shutil.which("pnpm")
    node = find_node(pnpm)
    prettier = root / "node_modules" / "prettier" / "bin" / "prettier.cjs"
    if not node or not prettier.is_file():
        warning(
            "Could not auto-format edited files because the local Node/Prettier runtime is unavailable. Run `pnpm install`."
        )
        return

    relative_paths = [str(path.relative_to(root)) for path in paths]
    formatted = subprocess.run(
        [node, str(prettier), "--write", "--", *relative_paths],
        cwd=root,
        text=True,
        capture_output=True,
    )
    if formatted.returncode != 0:
        detail = (formatted.stderr or formatted.stdout).strip().splitlines()[-1:]
        warning("Prettier failed after an edit" + (f": {detail[0]}" if detail else "."))
        return

    if any(path.suffix.lower() == ".tsx" for path in paths):
        tsx = root / "node_modules" / "tsx" / "dist" / "cli.mjs"
        token_linter = root / "packages" / "web" / "scripts" / "lint-tokens.ts"
        missing = [
            str(path.relative_to(root))
            for path in (tsx, token_linter)
            if not path.is_file()
        ]
        if missing:
            warning(
                "Could not lint design tokens after the TSX edit because these local "
                f"files are unavailable: {', '.join(missing)}. Run `pnpm install` if "
                "the tsx runtime is missing."
            )
            return

        tokens = subprocess.run(
            [node, str(tsx), str(token_linter)],
            cwd=root,
            text=True,
            capture_output=True,
        )
        if tokens.returncode != 0:
            excerpt = "\n".join((tokens.stdout + tokens.stderr).strip().splitlines()[-10:])
            print(
                json.dumps(
                    {
                        "hookSpecificOutput": {
                            "hookEventName": "PostToolUse",
                            "additionalContext": "Design token lint failed after the TSX edit:\n"
                            + excerpt,
                        }
                    }
                )
            )
            return

    print("{}")


if __name__ == "__main__":
    main()
