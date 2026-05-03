import * as fs from 'fs';
import path from 'path';

// --- 設定エリア ---
// 1. スキャンから除外するフォルダ名
const IGNORE_DIRS = ['.git', '.github', 'scripts', 'node_modules', 'templates'];
// 2. テンプレートと出力先のパス（画像に合わせて修正）
const TEMPLATE_PATH = './template.md'; 
const OUTPUT_PATH = './README.md';
// ----------------

interface TIL {
  category: string;
  title: string;
  path: string;
  date: string;
  mtime: number;
}

// 1. 指定されたディレクトリ配下のファイルを再帰的に取得
const getFiles = (dir: string): string[] => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(dirent => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  });
};

// 2. ルート直下のフォルダから、除外対象以外をすべて取得してスキャン
const rootDirs = fs.readdirSync('./', { withFileTypes: true })
  .filter(d => d.isDirectory() && !IGNORE_DIRS.includes(d.name))
  .map(d => `./${d.name}`);

const allFiles = rootDirs.flatMap(dir => getFiles(dir));

// 3. 記事データの解析と集計
const tils: TIL[] = allFiles
  .filter(file => file.endsWith('.md'))
  .map(filePath => {
    const stats = fs.statSync(filePath);
    const relativePath = path.relative(process.cwd(), filePath);
    const parts = relativePath.split(path.sep); // 例: [Git, sample.md]
    
    return {
      category: parts[0] || 'Uncategorized', // フォルダ名をカテゴリにする
      title: path.basename(filePath, '.md'),
      path: `./${relativePath.replace(/\\/g, '/')}`,
      date: stats.mtime.toISOString().split('T')[0].replace(/-/g, '/'),
      mtime: stats.mtime.getTime()
    };
  })
  .sort((a, b) => b.mtime - a.mtime); // 全記事を日付降順で並び替え

// 4. カテゴリごとのリスト作成
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

// 5. READMEを生成（テンプレートとの結合を廃止）
// 最新のTILリスト（tilSection）と、最終更新日時だけを書き出す
const finalContent = `# My TIL (Today I Learned)\n\n${tilSection}\n\n---\n> Last updated: ${new Date().toLocaleString('ja-JP')}`;

fs.writeFileSync(OUTPUT_PATH, finalContent);
console.log('README.md has been successfully rebuilt with only the TIL list!');