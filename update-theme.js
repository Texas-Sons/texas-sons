import fs from 'fs';
import path from 'path';

function replaceInFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [search, replace] of Object.entries(replacements)) {
    content = content.split(search).join(replace);
  }
  fs.writeFileSync(filePath, content);
}

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    fs.statSync(p).isDirectory() ? walk(p, callback) : callback(p);
  });
}

const generalReplacements = {
  'Sprout (Static)': 'Spur (Static)',
  'Stem (Flow)': 'Ranger (Flow)',
  'Bloom (Engine)': 'Maverick (Engine)',
  'Webloom': 'Texas Sons',
  'Motive': 'Texas Sons',
  'emerald': 'orange',
  'zinc-': 'stone-',
  'Leaf': 'Star',
  '>W<': '>T<'
};

walk('src', (p) => {
  if (p.endsWith('.ts') || p.endsWith('.tsx')) {
    replaceInFile(p, generalReplacements);
  }
});

const rootReplacements = {
  'Sprout (Static)': 'Spur (Static)',
  'Stem (Flow)': 'Ranger (Flow)',
  'Bloom (Engine)': 'Maverick (Engine)',
  'Sprout \\(Static\\)': 'Spur \\(Static\\)',
  'Stem \\(Flow\\)': 'Ranger \\(Flow\\)',
  'Bloom \\(Engine\\)': 'Maverick \\(Engine\\)',
  'Webloom': 'Texas Sons',
  'Motive': 'Texas Sons'
};

replaceInFile('index.html', rootReplacements);
replaceInFile('metadata.json', rootReplacements);
