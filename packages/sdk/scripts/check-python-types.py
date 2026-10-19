"""Check the public Python consumer; strict mode also rejects stale negative tests."""

import importlib.util
import os
from pathlib import Path
import subprocess
import sys

sdk = Path(__file__).resolve().parents[1]
python = sdk.parent / "python-sdk"
command = (
    [sys.executable, "-m", "mypy"]
    if importlib.util.find_spec("mypy")
    else ["uvx", "mypy"]
)
package = Path(os.environ.get("SDK_TYPECHECK_PACKAGE_PATH", str(python)))
subprocess.run(
    command
    + [
        "--strict",
        str(package / "groupi_sdk/client.pyi"),
        str(package / "groupi_sdk/transport.pyi"),
        str(package / "groupi_sdk/delegated.pyi"),
        str(python / "tests/consumer.py"),
    ],
    env={
        **os.environ,
        "MYPYPATH": os.environ.get("SDK_TYPECHECK_PACKAGE_PATH", str(python)),
    },
    check=True,
)
