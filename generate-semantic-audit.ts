import { Project, SyntaxKind, StringLiteral, JsxText, Node } from "ts-morph";
import * as fs from "fs";

const project = new Project({
	tsConfigFilePath: "tsconfig.json",
});

const sourceFiles = project.getSourceFiles([
	"app/[locale]/**/*.tsx",
	"components/**/*.tsx",
]);

const IGNORED_STRINGS = new Set([
	"use client",
	"use server",
	"div",
	"span",
	"button",
	"a",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"p",
]);

function slugifyArabic(text: string): string {
	const map: Record<string, string> = {
		ا: "a",
		أ: "a",
		إ: "i",
		آ: "a",
		ب: "b",
		ت: "t",
		ث: "th",
		ج: "j",
		ح: "h",
		خ: "kh",
		د: "d",
		ذ: "th",
		ر: "r",
		ز: "z",
		س: "s",
		ش: "sh",
		ص: "s",
		ض: "d",
		ط: "t",
		ظ: "dh",
		ع: "a",
		غ: "gh",
		ف: "f",
		ق: "q",
		ك: "k",
		ل: "l",
		م: "m",
		ن: "n",
		ه: "h",
		ة: "h",
		و: "w",
		ي: "y",
		ى: "a",
		ئ: "e",
		ؤ: "o",
		ء: "a",
	};
	let result = "";
	// take first 4 words max
	const words = text.trim().split(/\s+/).slice(0, 4).join(" ");

	for (const char of words) {
		if (map[char]) result += map[char];
		else if (/[a-zA-Z0-9]/.test(char)) result += char.toLowerCase();
		else if (char === " ") result += "_";
	}
	result = result.replace(/_+/g, "_").replace(/^_|_$/g, "").substring(0, 40);
	return result || "text";
}

const audit: {
	file: string;
	strings: { key: string; ar: string }[];
}[] = [];

// Global uniqueness tracker
const globalKeys = new Set<string>();

// Read old mappings directly from git to avoid PowerShell encoding issues
import { execSync } from "child_process";

const oldArRaw = execSync("git show a855ee9:messages/ar.json").toString("utf-8");
const oldEnRaw = execSync("git show a855ee9:messages/en.json").toString("utf-8");

const oldAr = JSON.parse(oldArRaw);
const oldEn = JSON.parse(oldEnRaw);

// Reverse map: Arabic text -> English text
const arabicToEnglishMap = new Map<string, string>();

function traverseOld(arObj: any, enObj: any) {
	for (const key in arObj) {
		if (typeof arObj[key] === "object") {
			traverseOld(arObj[key], enObj?.[key] || {});
		} else {
			if (arObj[key] && enObj?.[key]) {
				arabicToEnglishMap.set(arObj[key].trim(), enObj[key].trim());
			}
		}
	}
}
traverseOld(oldAr, oldEn);

// Track all generated translations to build final files
const finalAr: Record<string, Record<string, string>> = {};
const finalEn: Record<string, Record<string, string>> = {};

// Keep existing keys from messages/ar.json so we don't overwrite them
const currentAr = JSON.parse(fs.readFileSync("messages/ar.json", "utf-8"));
const currentEn = JSON.parse(fs.readFileSync("messages/en.json", "utf-8"));

for (const ns in currentAr) {
	finalAr[ns] = { ...currentAr[ns] };
	finalEn[ns] = { ...currentEn[ns] };
}

for (const sourceFile of sourceFiles) {
	const filePath = sourceFile.getFilePath().replace(project.getFileSystem().getCurrentDirectory() + "/", "");
	const fileStrings: { key: string; ar: string }[] = [];

	let namespace = "common";
	if (filePath.includes("/dashboard/admin/")) namespace = "admin";
	else if (filePath.includes("/dashboard/teacher/")) namespace = "teachers";
	else if (filePath.includes("/dashboard/parent/") || filePath.includes("/bookings/")) namespace = "bookings";
	else if (filePath.includes("/dashboard/")) namespace = "dashboard";
	else if (filePath.includes("/auth/") || filePath.includes("login") || filePath.includes("register")) namespace = "auth";

	if (!finalAr[namespace]) {
		finalAr[namespace] = {};
		finalEn[namespace] = {};
	}

	sourceFile.forEachDescendant((node: Node) => {
		if (Node.isStringLiteral(node) || Node.isJsxText(node)) {
			const text = node.getText().replace(/^["'`]|["'`]$/g, "").trim();

			// Ignore non-Arabic strings, small strings, ignores
			if (
				!text ||
				text.length < 2 ||
				IGNORED_STRINGS.has(text) ||
				!/[\u0600-\u06FF]/.test(text)
			) {
				return;
			}

			// Exclude console.logs
			const parent = node.getParent();
			if (parent && Node.isCallExpression(parent)) {
				if (parent.getExpression().getText().includes("console.")) return;
				if (parent.getExpression().getText().includes("t(")) return; // Already translated
			}

			// Generate unique key
			let baseSlug = slugifyArabic(text);
			if (baseSlug === "") baseSlug = "text";
			let uniqueKey = baseSlug;
			let counter = 1;

			// Check if this EXACT text already has a key generated in this namespace
			let existingKey = Object.keys(finalAr[namespace]).find(k => finalAr[namespace][k] === text);

			if (!existingKey) {
				// We need a new key
				while (finalAr[namespace][uniqueKey] !== undefined) {
					uniqueKey = `${baseSlug}_${counter}`;
					counter++;
				}
				
				finalAr[namespace][uniqueKey] = text;
				finalEn[namespace][uniqueKey] = arabicToEnglishMap.get(text) || `[TRANSLATE]: ${text}`;
				existingKey = uniqueKey;
			}

			fileStrings.push({
				key: `${namespace}.${existingKey}`,
				ar: text,
			});
		}
	});

	if (fileStrings.length > 0) {
		audit.push({
			file: filePath,
			strings: fileStrings,
		});
	}
}

fs.writeFileSync("semantic-audit.json", JSON.stringify(audit, null, 2));
fs.writeFileSync("messages/ar.json", JSON.stringify(finalAr, null, 2));
fs.writeFileSync("messages/en.json", JSON.stringify(finalEn, null, 2));

console.log("Audit complete. Generated semantic-audit.json");
