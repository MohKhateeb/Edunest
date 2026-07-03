import { Project, Node, SourceFile, FunctionDeclaration, ArrowFunction, FunctionExpression, VariableDeclaration, SyntaxKind } from "ts-morph";
import * as fs from "fs";

const project = new Project({
	tsConfigFilePath: "tsconfig.json",
});

const audit: {
	file: string;
	strings: { key: string; ar: string }[];
}[] = JSON.parse(fs.readFileSync("semantic-audit.json", "utf-8"));

const report = {
	modified: [] as string[],
	skipped: [] as { file: string; reason: string }[],
	totalReplacements: 0,
};

/**
 * Find the primary React component function in a source file.
 * Handles:
 *   1. `export default function Foo() {}`
 *   2. `export function Foo() {}`
 *   3. `export default function() {}`
 *   4. `export const Foo = () => {}` or `export const Foo = function() {}`
 *   5. `const Foo = () => {}`; export default Foo;
 *   6. Fallback: any function/arrow that returns JSX
 */
function findComponentFunction(sourceFile: SourceFile): {
	node: FunctionDeclaration | ArrowFunction | FunctionExpression;
	isArrow: boolean;
} | null {
	// 1-3: Exported function declarations
	const functions = sourceFile.getFunctions();
	for (const fn of functions) {
		if (fn.isDefaultExport() || fn.isExported()) {
			return { node: fn, isArrow: false };
		}
	}

	// 4: Exported variable declarations with arrow/function expression
	for (const varDecl of sourceFile.getVariableDeclarations()) {
		const varStmt = varDecl.getVariableStatement();
		if (!varStmt?.isExported()) continue;
		const init = varDecl.getInitializer();
		if (init && Node.isArrowFunction(init)) {
			return { node: init, isArrow: true };
		}
		if (init && Node.isFunctionExpression(init)) {
			return { node: init, isArrow: true };
		}
	}

	// 5: Default export referencing a variable
	const defaultExportSymbol = sourceFile.getDefaultExportSymbol();
	if (defaultExportSymbol) {
		const decls = defaultExportSymbol.getDeclarations();
		for (const decl of decls) {
			if (Node.isVariableDeclaration(decl)) {
				const init = decl.getInitializer();
				if (init && Node.isArrowFunction(init)) {
					return { node: init, isArrow: true };
				}
				if (init && Node.isFunctionExpression(init)) {
					return { node: init, isArrow: true };
				}
			}
			if (Node.isFunctionDeclaration(decl)) {
				return { node: decl, isArrow: false };
			}
		}
	}

	// 6: Fallback — find ALL named exported functions
	for (const varDecl of sourceFile.getVariableDeclarations()) {
		const varStmt = varDecl.getVariableStatement();
		if (!varStmt) continue;
		const init = varDecl.getInitializer();
		if (init && Node.isArrowFunction(init)) {
			return { node: init, isArrow: true };
		}
	}

	// Last resort: first function declaration
	if (functions.length > 0) {
		return { node: functions[0], isArrow: false };
	}

	return null;
}

function hasDirective(sourceFile: SourceFile, directive: string): boolean {
	const statements = sourceFile.getStatements();
	for (const stmt of statements) {
		if (Node.isExpressionStatement(stmt)) {
			const expr = stmt.getExpression();
			if (Node.isStringLiteral(expr) && expr.getLiteralValue() === directive) {
				return true;
			}
		} else {
			break; // Directives must be at the top
		}
	}
	return false;
}

for (const entry of audit) {
	const sourceFile = project.getSourceFile(entry.file);
	if (!sourceFile) {
		report.skipped.push({ file: entry.file, reason: "File not found in project" });
		continue;
	}

	const isClient = hasDirective(sourceFile, "use client") || entry.file.includes("components/");
	const hasUseServer = hasDirective(sourceFile, "use server");

	// Skip Server Actions and hooks — they need manual handling
	if (hasUseServer || entry.file.includes("lib/actions/") || entry.file.includes("hooks/")) {
		report.skipped.push({ file: entry.file, reason: "Server action or hook — needs manual handling" });
		continue;
	}

	// Determine namespace from first key
	const firstKey = entry.strings[0]?.key;
	if (!firstKey) continue;
	const namespace = firstKey.split(".")[0];

	// Step 1: Replace Arabic strings with t('key') calls
	let replacementCount = 0;

	sourceFile.forEachDescendant((node) => {
		if (Node.isStringLiteral(node) || Node.isJsxText(node)) {
			const rawText = Node.isStringLiteral(node)
				? node.getLiteralValue()
				: node.getText().trim();

			if (!rawText || !/[\u0600-\u06FF]/.test(rawText)) return;

			const mapping = entry.strings.find((s) => s.ar === rawText);
			if (!mapping) return;

			// Don't re-wrap if already inside t()
			const parent = node.getParent();
			if (parent && Node.isCallExpression(parent)) {
				const exprText = parent.getExpression().getText();
				if (exprText === "t" || exprText.endsWith(".t")) return;
			}

			// Skip module-level constants (outside any function body)
			// Also skip function parameter defaults (t not yet in scope)
			let isInsideFunctionBody = false;
			let isInParameterDefault = false;
			let ancestor: Node | undefined = node.getParent();
			while (ancestor) {
				if (ancestor.getKind() === SyntaxKind.Parameter || Node.isBindingElement(ancestor)) {
					isInParameterDefault = true;
					break;
				}
				if (Node.isBlock(ancestor)) {
					// We're inside a function BODY (block), not params
					isInsideFunctionBody = true;
					break;
				}
				ancestor = ancestor.getParent();
			}
			if (!isInsideFunctionBody || isInParameterDefault) return;

			const keyPart = mapping.key.split(".").slice(1).join(".");

			if (Node.isJsxText(node)) {
				node.replaceWithText(`{t('${keyPart}')}`);
				replacementCount++;
			} else if (Node.isStringLiteral(node)) {
				// Check context — inside JSX attribute needs {}
				if (parent && Node.isJsxAttribute(parent)) {
					node.replaceWithText(`{t('${keyPart}')}`);
				} else {
					node.replaceWithText(`t('${keyPart}')`);
				}
				replacementCount++;
			}
		}
	});

	if (replacementCount === 0) {
		report.skipped.push({ file: entry.file, reason: "No replacements made (strings may already be translated)" });
		continue;
	}

	// Step 2: Add import
	const importPath = isClient ? "next-intl" : "next-intl/server";
	const importName = isClient ? "useTranslations" : "getTranslations";

	const existingImport = sourceFile.getImportDeclaration(
		(decl) => decl.getModuleSpecifierValue() === importPath
	);
	if (existingImport) {
		const hasNamed = existingImport.getNamedImports().some((n) => n.getName() === importName);
		if (!hasNamed) existingImport.addNamedImport(importName);
	} else {
		// Insert after existing imports
		const imports = sourceFile.getImportDeclarations();
		const lastImportIndex = imports.length > 0
			? imports[imports.length - 1].getChildIndex()
			: 0;
		sourceFile.insertImportDeclaration(lastImportIndex + 1, {
			moduleSpecifier: importPath,
			namedImports: [{ name: importName }],
		});
	}

	// Step 3: Find ALL functions that contain t() calls and inject t declaration in each
	const allFunctions: (FunctionDeclaration | ArrowFunction | FunctionExpression)[] = [];
	
	// Collect all function declarations
	allFunctions.push(...sourceFile.getFunctions());
	
	// Collect all arrow functions and function expressions from variable declarations
	for (const varDecl of sourceFile.getVariableDeclarations()) {
		const init = varDecl.getInitializer();
		if (init && (Node.isArrowFunction(init) || Node.isFunctionExpression(init))) {
			allFunctions.push(init);
		}
	}

	let injectedInAny = false;

	for (const fn of allFunctions) {
		const body = fn.getBody();
		if (!body || !Node.isBlock(body)) continue;

		// Check if this function's body contains any t() calls
		let hasTCalls = false;
		body.forEachDescendant((node) => {
			if (Node.isCallExpression(node) && node.getExpression().getText() === "t") {
				hasTCalls = true;
			}
		});
		if (!hasTCalls) continue;

		// Check if t is already declared in this function
		const alreadyHasT = body.getStatements().some((stmt) => {
			const text = stmt.getText();
			return text.includes("const t =") || text.includes("const t=");
		});

		if (!alreadyHasT) {
			if (isClient) {
				body.insertStatements(0, `const t = useTranslations('${namespace}');`);
			} else {
				body.insertStatements(0, `const t = await getTranslations('${namespace}');`);
				if (Node.isFunctionDeclaration(fn)) {
					fn.setIsAsync(true);
				} else if (Node.isArrowFunction(fn) || Node.isFunctionExpression(fn)) {
					fn.setIsAsync(true);
				}
			}
			injectedInAny = true;
		}
	}

	if (!injectedInAny) {
		report.skipped.push({ file: entry.file, reason: "Could not find any function to inject t into" });
		sourceFile.refreshFromFileSystemSync();
		continue;
	}

	report.modified.push(entry.file);
	report.totalReplacements += replacementCount;
}

project.saveSync();

console.log("\n=== Wiring Report ===");
console.log(`Modified files: ${report.modified.length}`);
console.log(`Total replacements: ${report.totalReplacements}`);
console.log(`\nSkipped files: ${report.skipped.length}`);
for (const s of report.skipped) {
	console.log(`  - ${s.file}: ${s.reason}`);
}
console.log(`\nModified files:`);
for (const f of report.modified) {
	console.log(`  ✓ ${f}`);
}

fs.writeFileSync("wire-report.json", JSON.stringify(report, null, 2));
