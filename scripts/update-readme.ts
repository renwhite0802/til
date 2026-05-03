import * as fs from 'fs';
import path from 'path';

const TIL_DIR = './til';
const TEMPLATE_PATH = './templates/main.md';
const OUTPUT_PATH = './README.md';

interface TIL {
  category: string;
  title: string;
  path: string;
  date: string;
  mtime: number;
}

// 1. ファイル一覧の取得
const getFiles = (dir: string): string[] => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(dirent => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  });
};

// 2. 記事データの解析と集計
const tils: TIL[] = getFiles(TIL_DIR)
  .filter(file => file.endsWith('.md'))
  .map(filePath => {
    const stats = fs.statSync(filePath);
    const relativePath = path.relative(process.cwd(), filePath);
    const parts = relativePath.split(path.sep);
    return {
      category: parts[1] || 'Uncategorized',
      title: path.basename(filePath, '.md'),
      path: `./${relativePath.replace(/\\/g, '/')}`,
      date: stats.mtime.toISOString().split('T')[0].replace(/-/g, '/'),
      mtime: stats.mtime.getTime()
    };
  })
  .sort((a, b) => b.mtime - a.mtime); // 日付降順

// 3. カテゴリごとのリスト作成
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

// 4. テンプレートと結合してREADMEを生成
const template = fs.existsSync(TEMPLATE_PATH) 
  ? fs.readFileSync(TEMPLATE_PATH, 'utf8') 
  : '# My TIL\n';

const finalContent = `${template}\n---\n${tilSection}\n\n> Last updated: ${new Date().toLocaleString('ja-JP')}`;

fs.writeFileSync(OUTPUT_PATH, finalContent);
console.log('README.md has been successfully rebuilt!');