import {Project, SyntaxKind, Node} from 'ts-morph'
import * as fs from 'fs'
import * as path from 'path'

const project = new Project({tsConfigFilePath: './tsconfig.json'})
const audit = JSON.parse(fs.readFileSync('./deep-audit.json', 'utf-8'))
let arMsg = JSON.parse(fs.readFileSync('./messages/ar.json', 'utf-8'))
let enMsg = JSON.parse(fs.readFileSync('./messages/en.json', 'utf-8'))

const stats = {wired:0, objectConverted:0, skipped:0, errors:[] as string[]}

// ── Key management ───────────────────────────────────────────────────
function findExistingKey(ns: string, arabic: string): string | null {
  const nsObj = arMsg[ns] ?? {}
  for (const [k, v] of Object.entries(nsObj)) {
    if (v === arabic) return k
  }
  return null
}

function ensureKey(ns: string, arabic: string): string {
  const existing = findExistingKey(ns, arabic)
  if (existing) return existing
  // Also search other namespaces
  for (const [otherNs, keys] of Object.entries(arMsg)) {
    for (const [k, v] of Object.entries(keys as any)) {
      if (v === arabic) return k  // return just the key, caller uses ns
    }
  }
  const key = 'str_' + Date.now().toString(36) + '_' + 
    Buffer.from(arabic).toString('base64').replace(/\W/g,'').slice(0,6)
  if (!arMsg[ns]) arMsg[ns] = {}
  if (!enMsg[ns]) enMsg[ns] = {}
  arMsg[ns][key] = arabic
  enMsg[ns][key] = `[TRANSLATE]: ${arabic}`
  return key
}

function nsForFile(fp: string): string {
  if (fp.includes('/admin/'))    return 'admin'
  if (fp.includes('/teacher/'))  return 'teachers'
  if (fp.includes('/parent/'))   return 'parent'
  if (fp.includes('/auth/'))     return 'auth'
  if (fp.includes('/help/'))     return 'help'
  if (fp.includes('/terms/'))    return 'legal'
  if (fp.includes('/privacy/'))  return 'legal'
  if (fp.includes('/teachers/')) return 'teachers'
  return 'common'
}

// ── Process each file ────────────────────────────────────────────────
const byFile = audit.byFile as Record<string, any[]>

for (const [relPath, findings] of Object.entries(byFile)) {
  if (!relPath.includes('AdminSettingsForm.tsx')) continue;

  const absPath = path.join(process.cwd(), relPath)
  if (!fs.existsSync(absPath)) { stats.skipped++; continue }

  try {
    const sf = project.getSourceFile(absPath) 
      ?? project.addSourceFileAtPath(absPath)
    const isClient = sf.getText().includes("'use client'") || 
                     sf.getText().includes('"use client"')
    const ns = nsForFile(relPath)
    let fileWired = 0
    let fileObjConverted = 0

    // ── PASS 1: Object literals OUTSIDE components → factory function ──
    const outsideFindings = findings.filter(
      (f: any) => !f.inComponent && f.context === 'OBJECT_VALUE'
    )

    for (const finding of outsideFindings) {
      const arabic = finding.text
      const nodes = sf.getDescendantsOfKind(SyntaxKind.StringLiteral)
        .filter(n => n.getLiteralText().trim() === arabic.trim())
        .filter(n => {
          const parent = n.getParent()
          return Node.isPropertyAssignment(parent)
        })

      for (const n of nodes) {
        const key = ensureKey(ns, arabic.trim())
        const propAssign = n.getParent() as any
        const objLiteral = propAssign?.getParent()
        const varDecl = objLiteral?.getParent()
        
        let inFn = false
        let cur: Node | undefined = n.getParent()
        while (cur) {
          if (Node.isArrowFunction(cur) || Node.isFunctionDeclaration(cur) || 
              Node.isFunctionExpression(cur)) { inFn = true; break }
          cur = cur.getParent()
        }

        if (inFn) {
          n.replaceWithText(`t('${key}')`)
          fileWired++
        } else {
          n.replaceWithText(`t('${key}') /* wire: add t param */`)
          fileObjConverted++
        }
      }
    }

    // ── PASS 2: Inside component strings ──
    const insideFindings = findings.filter((f: any) => f.inComponent)

    for (const finding of insideFindings) {
      const arabic = finding.text
      const key = ensureKey(ns, arabic.trim())

      sf.getDescendantsOfKind(SyntaxKind.JsxText)
        .filter(n => n.getText().trim() === arabic.trim())
        .forEach(n => {
          n.replaceWithText(`{t('${key}')}`)
          fileWired++
        })

      sf.getDescendantsOfKind(SyntaxKind.StringLiteral)
        .filter(n => n.getLiteralText().trim() === arabic.trim())
        .forEach(n => {
          const parent = n.getParent()
          if (Node.isJsxAttribute(parent)) {
            const attrName = (parent as any).getNameNode?.()?.getText?.() ?? ''
            const SKIP = ['className','href','id','name','src','key','type',
                         'value','style','data-testid']
            if (SKIP.includes(attrName)) return
            ;(parent as any).setInitializer(`{t('${key}')}`)
          } else if (!Node.isImportDeclaration(parent) && 
                     !Node.isImportDeclaration(parent?.getParent())) {
            n.replaceWithText(`t('${key}')`)
          }
          fileWired++
        })
    }

    // ── PASS 3: Ensure t() is available ──
    const fileText = sf.getText()
    const hasTCall = fileText.includes("t('") || fileText.includes('t("')
    const hasTDecl = fileText.includes('useTranslations') || 
                     fileText.includes('getTranslations')

    if (hasTCall && !hasTDecl) {
      const importSrc = isClient ? 'next-intl' : 'next-intl/server'
      const hookFn = isClient ? 'useTranslations' : 'getTranslations'
      
      const existing = sf.getImportDeclaration(
        d => d.getModuleSpecifierValue() === importSrc
      )
      if (existing) {
        const names = existing.getNamedImports().map(i => i.getName())
        if (!names.includes(hookFn)) existing.addNamedImport(hookFn)
      } else {
        sf.insertImportDeclaration(0, {
          moduleSpecifier: importSrc,
          namedImports: [hookFn],
        })
      }

      const hookCall = isClient
        ? `const t = useTranslations('${ns}')`
        : `const t = await getTranslations('${ns}')`

      const exportedFns = sf.getFunctions().filter(
        f => f.isExported() || f.isDefaultExport()
      )
      const target = exportedFns[0]
      if (target) {
        if (!isClient && !target.isAsync()) target.setIsAsync(true)
        const body = target.getBody()
        if (body && Node.isBlock(body)) {
          body.insertStatements(0, hookCall)
        }
      }
    }

    sf.saveSync()
    stats.wired += fileWired
    stats.objectConverted += fileObjConverted

    if (fileWired + fileObjConverted > 0) {
      console.log(`✓ ${relPath} — ${fileWired} wired, ${fileObjConverted} obj-converted`)
    }

  } catch (e: any) {
    stats.errors.push(`${relPath}: ${e.message}`)
    console.error(`✗ ${relPath}: ${e.message}`)
  }
}

// Option A: Move objects inside the component manually!
// I will not do the regex replace here. I will just let it add `t('key') /* wire: add t param */`.
// I will manually fix it with replace_file_content!

fs.writeFileSync('./messages/ar.json', JSON.stringify(arMsg, null, 2))
fs.writeFileSync('./messages/en.json', JSON.stringify(enMsg, null, 2))
console.log('Done.')
