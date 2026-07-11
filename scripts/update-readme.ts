import * as fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// --- 設定エリア ---
const IGNORE_DIRS = ['.git', '.github', 'scripts', 'node_modules', 'templates'];
const TEMPLATE_PATH = './template.md';
const OUTPUT_PATH = './README.md';
// ----------------

interface TIL {
  category: string;
  title: string;
  path: string;
  date: string;
  timestamp: number; // ソート用（mtimeではなくgitのコミット時刻）
}

const getFiles = (dir: string): string[] => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(dirent => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  });
};

// Gitログからファイルの最終コミット日時（ISO文字列）を取得
const getLastCommitDate = (relativePath: string): string | null => {
  try {
    const result = execSync(
      `git log -1 --follow --format=%cI -- "${relativePath}"`,
      { encoding: 'utf-8' }
    ).trim();
    return result || null;
  } catch {
    return null;
  }
};

const rootDirs = fs.readdirSync('./', { withFileTypes: true })
  .filter(d => d.isDirectory() && !IGNORE_DIRS.includes(d.name))
  .map(d => `./${d.name}`);

const allFiles = rootDirs.flatMap(dir => getFiles(dir));

const tils: TIL[] = allFiles
  .filter(file => file.endsWith('.md'))
  .map(filePath => {
    const relativePath = path.relative(process.cwd(), filePath);
    const parts = relativePath.split(path.sep);

    // Gitの履歴から日付を取得。取得できない場合（新規追加直後など）はfs統計へフォールバック
    const commitDateIso = getLastCommitDate(relativePath);
    const dateObj = commitDateIso ? new Date(commitDateIso) : fs.statSync(filePath).mtime;

    return {
      category: parts[0] || 'Uncategorized',
      title: path.basename(filePath, '.md'),
      path: `./${relativePath.replace(/\\/g, '/')}`,
      date: dateObj.toISOString().split('T')[0].replace(/-/g, '/'),
      timestamp: dateObj.getTime()
    };
  })
  .sort((a, b) => b.timestamp - a.timestamp);

// --- 以下は変更なし ---
const grouped = tils.reduce((acc, til) => {
  if (!acc[til.category]) acc[til.category] = [];
  acc[til.category].push(til);
  return acc;
}, {} as Record<string, TIL[]>);

let tilSection = `\n## Latest TILs (${tils.length} posts)\n`;
for (const [category, items] of Object.entries(grouped)) {
  tilSection += `\n### ${category}\n`;
  items.forEach(item => {
    tilSection += `- [${item.title}](${item.path}) - ${item.date}\n`;
  });
}

const finalContent = `# My TIL (Today I Learned)\n\n${tilSection}\n\n---\n> Last updated: ${new Date().toLocaleString('ja-JP')}`;
fs.writeFileSync(OUTPUT_PATH, finalContent);
console.log('README.md has been successfully rebuilt with only the TIL list!');