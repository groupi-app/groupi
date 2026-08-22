#!/usr/bin/env python3
"""Regression tests for the Codex post-edit formatting hook."""

import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest import mock

import format_edited_files as hook


class FormatEditedFilesTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary_directory.name).resolve()
        self.component = self.root / "component.tsx"
        self.prettier = self.root / "node_modules" / "prettier" / "bin" / "prettier.cjs"
        self.tsx = self.root / "node_modules" / "tsx" / "dist" / "cli.mjs"
        self.token_linter = (
            self.root / "packages" / "web" / "scripts" / "lint-tokens.ts"
        )

        for path in (self.component, self.prettier, self.tsx, self.token_linter):
            path.parent.mkdir(parents=True, exist_ok=True)
            path.touch()

    def tearDown(self) -> None:
        self.temporary_directory.cleanup()

    def run_hook(self) -> tuple[str, list[mock._Call]]:
        payload = {
            "cwd": str(self.root),
            "tool_input": {"command": "*** Update File: component.tsx\n"},
        }
        completed = subprocess.CompletedProcess(args=[], returncode=0, stdout="", stderr="")

        with (
            mock.patch.object(sys, "stdin", io.StringIO(json.dumps(payload))),
            mock.patch.object(sys, "stdout", new_callable=io.StringIO) as stdout,
            mock.patch.object(
                hook.subprocess, "check_output", return_value=str(self.root)
            ),
            mock.patch.object(hook, "find_node", return_value="/runtime/node"),
            mock.patch.object(hook.subprocess, "run", return_value=completed) as run,
        ):
            hook.main()

        return stdout.getvalue(), run.call_args_list

    def test_tsx_edit_uses_repo_local_runtime_without_pnpm(self) -> None:
        output, calls = self.run_hook()

        self.assertEqual(output.strip(), "{}")
        self.assertEqual(len(calls), 2)
        self.assertEqual(
            calls[0].args[0],
            [
                "/runtime/node",
                str(self.prettier),
                "--write",
                "--",
                "component.tsx",
            ],
        )
        self.assertEqual(
            calls[1].args[0],
            ["/runtime/node", str(self.tsx), str(self.token_linter)],
        )
        self.assertNotIn("pnpm", " ".join(calls[1].args[0]))

    def test_missing_local_tsx_reports_a_warning(self) -> None:
        self.tsx.unlink()

        output, calls = self.run_hook()
        response = json.loads(output)

        self.assertEqual(len(calls), 1)
        self.assertIn("node_modules/tsx/dist/cli.mjs", response["systemMessage"])


if __name__ == "__main__":
    unittest.main()
