# Consume shared source inside the workspace

Workspace applications, tests, and tooling consume the same shared TypeScript
source through consistent entry points. The shared package retains compiled
exports for distribution, generated and validated by its packaging path. This
avoids stale checked-in builds masking differences between test and runtime
resolution while preserving possible external consumers.

Disposable build and coverage output is excluded from version control once
clean-checkout verification passes. Canonical generated Convex contracts remain
versioned where existing workflows require them; generated files are classified
by their role rather than removed indiscriminately.
