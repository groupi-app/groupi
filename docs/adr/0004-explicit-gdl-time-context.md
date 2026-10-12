# Interpret GDL with explicit time context

One runtime-neutral GDL implementation interprets expressions against an explicit
reference instant and timezone. Web and mobile supply the device timezone; REST
accepts an optional timezone and defaults to UTC. This preserves request shapes
while removing host-dependent interpretation, rather than maintaining separate
client and backend grammars.

Descending time ranges cross midnight. Calendar recurrences retain local clock
time and durations measure elapsed time. Nonexistent or ambiguous local times
produce explicit errors instead of silently shifting or selecting an occurrence;
this favors an actionable correction over guessing the intended event time.
