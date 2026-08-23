#!/usr/bin/env python3
"""Ask Codex to mention a missing changeset once before ending a turn."""

import json
from pathlib import Path
import subprocess
import sys


def main() -> None:
    payload = json.load(sys.stdin)
    if payload.get("stop_hook_active"):
        print("{}")
        return

    cwd = Path(payload.get("cwd") or ".").resolve()
    try:
        root = Path(
            subprocess.check_output(
                ["git", "rev-parse", "--show-toplevel"], cwd=cwd, text=True
            ).strip()
        )
        status = subprocess.check_output(
            ["git", "status", "--porcelain", "--untracked-files=all"],
            cwd=root,
            text=True,
        )
    except (OSError, subprocess.CalledProcessError):
        print("{}")
        return

    changed = [line[3:] for line in status.splitlines() if len(line) > 3]
    source_suffixes = {".cjs", ".js", ".jsx", ".mjs", ".ts", ".tsx"}
    source_changed = any(
        (path.startswith("packages/") or path.startswith("convex/"))
        and Path(path).suffix in source_suffixes
        and ".test." not in path
        and "/__tests__/" not in path
        for path in changed
    )
    changeset_changed = any(
        path.startswith(".changeset/") and not path.endswith("README.md")
        for path in changed
    )

    if source_changed and not changeset_changed:
        print(
            json.dumps(
                {
                    "decision": "block",
                    "reason": "Before finalizing, remind the user that user-facing source changes need a changeset and offer to help them run `pnpm changeset`. Do not create one without confirmation.",
                }
            )
        )
        return

    print("{}")


if __name__ == "__main__":
    main()
