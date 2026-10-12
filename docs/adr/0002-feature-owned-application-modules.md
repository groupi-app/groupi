# Organize application behavior by feature

Application features own their UI, hooks, supporting logic, and tests behind a
focused interface. Reusable UI remains in the atomic design system, while routes
compose feature modules. This convention favors locality over organizing all
application behavior by file type or UI complexity; add-ons are the first
migration, with other features adopting the convention incrementally.

Refactoring may also fix discovered behavior defects. Specific behavior changes
and their regression coverage are resolved during each feature's design; the
convention alone does not define new product behavior. The first application is
documented in [Add-on Feature Design](../addon-feature-design.md). Tooling enforces
imports through focused public entry points as each feature migrates, beginning
with add-ons. Runtime consumers remain independent of authoring code.
