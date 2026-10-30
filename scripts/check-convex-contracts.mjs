import process from 'node:process';
import console from 'node:console';
import ts from 'typescript';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Check only exported native Convex contracts, not third-party implementation details.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(root, 'convex/tsconfig.json');
const cfg = ts.readConfigFile(configPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(
  cfg.config,
  ts.sys,
  path.dirname(configPath)
);
const program = ts.createProgram(parsed.fileNames, parsed.options);
const checker = program.getTypeChecker();
const source = program.getSourceFile(
  path.join(root, 'convex/_generated/api.d.ts')
);
const moduleSymbol = checker.getSymbolAtLocation(source);
const findings = [];
let count = 0;
function loose(type, route, seen = new Set(), depth = 0) {
  if (type.flags & ts.TypeFlags.Any) return [route + ': any'];
  if (type.flags & ts.TypeFlags.Unknown) return [route + ': unknown'];
  if (seen.has(type)) return [];
  if (depth > 30) return [route + ': traversal exceeded 30 levels'];
  const awaited = checker.getAwaitedType(type);
  if (awaited && awaited !== type)
    return loose(awaited, route, seen, depth + 1);
  seen = new Set(seen);
  seen.add(type);
  if (type.isUnionOrIntersection())
    return type.types.flatMap(t => loose(t, route, seen, depth + 1));
  if (
    type.flags &
    (ts.TypeFlags.StringLike |
      ts.TypeFlags.NumberLike |
      ts.TypeFlags.BooleanLike |
      ts.TypeFlags.BigIntLike |
      ts.TypeFlags.Null |
      ts.TypeFlags.Undefined |
      ts.TypeFlags.Void |
      ts.TypeFlags.Never)
  )
    return [];
  const indexed = type.getStringIndexType();
  if (indexed) {
    const r = loose(indexed, route + '[key]', seen, depth + 1);
    if (r.length) return r;
  }
  if (checker.isArrayType(type) || checker.isTupleType(type))
    return checker
      .getTypeArguments(type)
      .flatMap(t => loose(t, route + '[]', seen, depth + 1));
  return type
    .getProperties()
    .flatMap(p =>
      loose(
        checker.getTypeOfSymbolAtLocation(p, source),
        route + '.' + p.name,
        seen,
        depth + 1
      )
    );
}
function walk(type, prefix, depth = 0) {
  const kind = type.getProperty('_type');
  if (kind) {
    const kt = checker.typeToString(
      checker.getTypeOfSymbolAtLocation(kind, source)
    );
    if (!['"query"', '"mutation"'].includes(kt)) return;
    count++;
    for (const name of ['_args', '_returnType']) {
      const p = type.getProperty(name);
      if (p) {
        const issues = loose(
          checker.getTypeOfSymbolAtLocation(p, source),
          prefix + '.' + name
        );
        if (issues.length) findings.push(...new Set(issues));
      }
    }
    return;
  }
  if (depth > 8)
    throw new Error(`Convex module traversal exceeded 8 levels at ${prefix}`);
  for (const p of type.getProperties())
    walk(
      checker.getTypeOfSymbolAtLocation(p, source),
      prefix + '.' + p.name,
      depth + 1
    );
}
for (const exp of checker
  .getExportsOfModule(moduleSymbol)
  .filter(s => ['api', 'internal'].includes(s.name)))
  walk(checker.getTypeOfSymbolAtLocation(exp, source), exp.name);

// Generated imports can be stale after adding a module. Inspect every source
// export as well, using Convex's preserved RegisteredQuery/Mutation generics.
let sourceCount = 0;
for (const file of program.getSourceFiles()) {
  const relative = path.relative(path.join(root, 'convex'), file.fileName);
  if (
    relative.startsWith('..') ||
    file.isDeclarationFile ||
    relative.includes('_generated') ||
    relative.startsWith('betterAuth/') ||
    relative.startsWith('tests/')
  )
    continue;
  const symbol = checker.getSymbolAtLocation(file);
  if (!symbol) continue;
  for (const exported of checker.getExportsOfModule(symbol)) {
    const target =
      exported.flags & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(exported)
        : exported;
    if (!(target.flags & ts.SymbolFlags.Value)) continue;
    const type = checker.getTypeOfSymbolAtLocation(exported, file);
    // An annotation or assertion can erase Convex's registration markers and
    // make the generated API silently omit the function. Fail closed before
    // consulting those markers, including for exported aliases.
    if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) {
      findings.push(...loose(type, `source.${relative}:${exported.name}`));
      continue;
    }
    if (!type.getProperty('isQuery') && !type.getProperty('isMutation'))
      continue;
    const args = type.aliasTypeArguments;
    if (!args || args.length !== 3)
      throw new Error(
        `Cannot inspect Convex function ${relative}:${exported.name}`
      );
    sourceCount++;
    findings.push(
      ...loose(args[1], `source.${relative}:${exported.name}._args`)
    );
    findings.push(
      ...loose(args[2], `source.${relative}:${exported.name}._returnType`)
    );
  }
}
const unique = [...new Set(findings)];
if (process.argv.includes('--json'))
  console.log(
    JSON.stringify({ count, sourceCount, findings: unique }, null, 2)
  );
else {
  console.log(
    `Checked ${count} generated and ${sourceCount} source Convex query/mutation contracts.`
  );
  for (const finding of unique) console.error(finding);
}
if (count === 0)
  throw new Error(
    'No Convex contracts found; regenerate the API before checking.'
  );
if (unique.length) process.exitCode = 1;
