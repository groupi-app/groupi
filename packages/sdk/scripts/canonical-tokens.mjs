import ts from 'typescript';
import process from 'node:process';
let source = '';
for await (const chunk of process.stdin) source += chunk.toString();
const file = ts.createSourceFile(
  'contract.ts',
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TS
);
function canonical(node) {
  if (ts.isParenthesizedTypeNode(node)) return canonical(node.type);
  if (ts.isParenthesizedExpression(node)) return canonical(node.expression);
  if (
    (ts.isIdentifier(node) || ts.isStringLiteral(node)) &&
    node.parent?.name === node &&
    (ts.isPropertySignature(node.parent) ||
      ts.isPropertyAssignment(node.parent) ||
      ts.isMethodDeclaration(node.parent))
  )
    return ['property', node.text];
  const children = [];
  ts.forEachChild(node, child => {
    children.push(canonical(child));
  });
  const value = { kind: node.kind, children };
  if (
    ts.isIdentifier(node) ||
    ts.isLiteralExpression(node) ||
    ts.isTemplateLiteralToken(node)
  )
    value.text = node.text;
  for (const key of ['operator', 'isTypeOnly', 'isExportEquals'])
    if (node[key] !== undefined) value[key] = node[key];
  return value;
}
process.stdout.write(JSON.stringify(canonical(file)));
