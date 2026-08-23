#!/usr/bin/env python3
"""Block shell commands prohibited by the repository's Codex policy."""

import json
import re
import sys
from typing import Optional


PROHIBITED_PNPM = re.compile(
    r"\bpnpm\s+(?:dev|dev:web|dev:convex|dev:shared|dev:mobile|dev:all|"
    r"build|build:web|build:convex|build:shared|build:mobile|start|preview|"
    r"convex:dev|convex:deploy)\b"
)
NON_PNPM = re.compile(
    r"\b(?:npm\s+(?:install|i|run|exec|ci|start|build|test)|yarn\s|npx\s+create-)"
)
RAW_NEXT = re.compile(r"\bnext\s+(?:dev|build|start)\b")
COMMIT_TYPE = r"(?:feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)"
COMMIT_HEADER = re.compile(rf"^{COMMIT_TYPE}(?:\([a-z,]+\))?!?:\s+(.+)$")


def deny(reason: str) -> None:
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": reason,
                }
            }
        )
    )


def commit_message(command: str) -> Optional[str]:
    conventional = re.search(rf"{COMMIT_TYPE}(?:\([a-z,]+\))?!?:\s+[^\n'\"]+", command)
    if conventional:
        return conventional.group(0).strip()

    quoted = re.search(r"(?:^|\s)-m\s+(['\"])(.*?)\1", command, re.DOTALL)
    if quoted:
        return quoted.group(2).splitlines()[0].strip()
    return None


def main() -> None:
    payload = json.load(sys.stdin)
    tool_input = payload.get("tool_input") or {}
    command = tool_input.get("command") or tool_input.get("cmd") or ""

    if PROHIBITED_PNPM.search(command):
        deny(
            "Dev servers, builds, previews, and Convex deploy commands are prohibited. "
            "Use pnpm check, pnpm test:run, pnpm generate, or pnpm lint:fix; see "
            ".agents/rules/scripts.md."
        )
        return

    if NON_PNPM.search(command):
        deny("Use pnpm for this repository; npm, yarn, and npx create commands are prohibited.")
        return

    if RAW_NEXT.search(command):
        deny("Do not run the Next.js CLI directly. The development server is assumed to be running.")
        return

    if re.search(r"\bgit\s+commit\b", command):
        message = commit_message(command)
        if message:
            match = COMMIT_HEADER.match(message)
            if not match:
                deny(
                    "Commit messages must use a conventional type: "
                    "type(scope): lowercase description."
                )
                return
            subject = match.group(1)
            if subject[:1].isupper():
                deny("The conventional commit subject must begin with a lowercase character.")
                return
            if len(message) > 100:
                deny(f"The commit header is {len(message)} characters; the maximum is 100.")
                return

    print("{}")


if __name__ == "__main__":
    main()
