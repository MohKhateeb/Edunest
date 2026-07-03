import { Project, SyntaxKind, Node } from 'ts-morph'
import * as fs from 'fs'
import * as path from 'path'

const project = new Project({ tsConfigFilePath: './tsconfig.json' })
const remaining = JSON.parse(
  fs.readFileSync('./arabic-strings-remaining.json', 'utf-8')
) as Record<string, Array<{line: number; text: string}>>

const arMessages = JSON.parse(fs.readFileSync('./messages/ar.json', 'utf-8'))
const enMessages = JSON.parse(fs.readFileSync('./messages/en.json', 'utf-8'))

const errors: string[] = []
const stats = { filesProcessed: 0, replacements: 0, skipped: 0 }

// ── Helpers ──────────────────────────────────────────────────────────
function toKey(text: string): string {
  return text
    .trim()
    .replace(/[\u0600-\u06FF]/g, '')   // remove Arabic
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .toLowerCase()
    .substring(0, 40)
    || `key_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

function namespaceForFile(filePath: string): string {
  if (filePath.includes('/admin/'))    return 'admin'
  if (filePath.includes('/teacher/'))  return 'teachers'
  if (filePath.includes('/parent/'))   return 'parent'
  if (filePath.includes('/auth/'))     return 'auth'
  if (filePath.includes('/help/'))     return 'help'
  if (filePath.includes('/terms/'))    return 'legal'
  return 'common'
}

function isClientComponent(sourceFile: any): boolean {
  const first = sourceFile.getStatements()[0]
  return first?.getText()?.includes('use client') ?? false
}

function getOrCreateKey(ns: string, arabicText: string): string {
  if (!arMessages[ns]) arMessages[ns] = {}
  if (!enMessages[ns]) enMessages[ns] = {}

  // Check if already exists
  for (const [k, v] of Object.entries(arMessages[ns])) {
    if (v === arabicText) return `${ns}.${k}`
  }

  const key = toKey(arabicText) || `str_${Object.keys(arMessages[ns]).length}`
  arMessages[ns][key] = arabicText
  enMessages[ns][key] = `[TRANSLATE]: ${arabicText}`
  return `${ns}.${key}`
}

// ── Process each file ─────────────────────────────────────────────────
for (const [relPath, strings] of Object.entries(remaining)) {
  const absolutePath = path.join(process.cwd(), relPath)
  if (!fs.existsSync(absolutePath)) { errors.push(`NOT FOUND: ${relPath}`); continue }

  try {
    const sourceFile = project.getSourceFile(absolutePath)
      ?? project.addSourceFileAtPath(absolutePath)

    const ns = namespaceForFile(relPath)
    const isClient = isClientComponent(sourceFile)
    let fileReplacements = 0

    // Track which t-variable names already exist per namespace
    const usedNamespaces = new Set<string>()

    for (const { text: arabicText } of strings) {
      if (!arabicText?.trim()) continue
      const fullKey = getOrCreateKey(ns, arabicText.trim())
      const [namespace, keyName] = fullKey.split('.')

      // Find JsxText nodes matching this Arabic text
      sourceFile
        .getDescendantsOfKind(SyntaxKind.JsxText)
        .filter(n => n.getText().trim() === arabicText.trim())
        .forEach(node => {
          node.replaceWithText(`{t('${keyName}')}`)
          usedNamespaces.add(namespace)
          fileReplacements++
        })

      // Find StringLiteral nodes (JSX attribute values, props)
      sourceFile
        .getDescendantsOfKind(SyntaxKind.StringLiteral)
        .filter(n => n.getLiteralText().trim() === arabicText.trim())
        .forEach(node => {
          const parent = node.getParent()
          const grandParent = parent?.getParent()
          // Only replace if inside JSX (not imports, not object keys)
          if (
            Node.isJsxAttribute(parent) ||
            Node.isJsxExpression(parent) ||
            Node.isTemplateSpan(parent)
          ) {
            node.replaceWithText(`t('${keyName}')`)
            usedNamespaces.add(namespace)
            fileReplacements++
          }
        })
    }

    if (fileReplacements === 0) {
      stats.skipped++
      continue
    }

    // Inject import and hook for each namespace used
    for (const namespace of usedNamespaces) {
      const varName = namespace === 'common' ? 't' : `t${namespace.charAt(0).toUpperCase() + namespace.slice(1)}`
      
      // Add import if not present
      const hasImport = sourceFile.getImportDeclaration(
        d => d.getModuleSpecifierValue() === 'next-intl'
      )
      if (!hasImport) {
        sourceFile.addImportDeclaration({
          moduleSpecifier: 'next-intl',
          namedImports: [isClient ? 'useTranslations' : 'getTranslations'],
        })
      }

      // Add hook call inside component if not present
      const fnText = isClient
        ? `const ${varName} = useTranslations('${namespace}')`
        : `const ${varName} = await getTranslations('${namespace}')`

      // Find the first function body and inject if hook not already there
      const funcs = sourceFile.getFunctions()
      const arrows = sourceFile.getVariableDeclarations().filter(v =>
        v.getInitializer()?.getKindName().includes('Arrow')
      )
      const target = [...funcs, ...arrows].find(f => {
        const body = (f as any).getBody?.()
        return body && !body.getText().includes(fnText)
      })
      if (target) {
        const body = (target as any).getBody?.()
        if (body && Node.isBlock(body)) {
          body.insertStatements(0, fnText)
        }
      }
    }

    sourceFile.saveSync()
    stats.filesProcessed++
    stats.replacements += fileReplacements
    console.log(`✓ ${relPath} — ${fileReplacements} replacements`)

  } catch (err: any) {
    errors.push(`ERROR in ${relPath}: ${err.message}`)
    console.error(`✗ ${relPath}: ${err.message}`)
  }
}

// ── Save updated messages ─────────────────────────────────────────────
fs.writeFileSync('./messages/ar.json', JSON.stringify(arMessages, null, 2))
fs.writeFileSync('./messages/en.json', JSON.stringify(enMessages, null, 2))

// ── Summary ───────────────────────────────────────────────────────────
console.log('\n══════════════════════════════')
console.log(`Files processed:  ${stats.filesProcessed}`)
console.log(`Files skipped:    ${stats.skipped}`)
console.log(`Replacements:     ${stats.replacements}`)
console.log(`Errors:           ${errors.length}`)
if (errors.length) {
  fs.writeFileSync('./wire-errors.txt', errors.join('\n'))
  console.log('Errors saved to wire-errors.txt')
}
