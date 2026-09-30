const fs = require('fs');
const path = require('path');

// 1. Gather all direct dependencies
const pkgPaths = [
  'apps/dashboard-admin/package.json',
  'apps/dashboard-apbd/package.json',
  'apps/dashboard-auditor/package.json',
  'apps/dashboard-bank/package.json',
  'apps/dashboard-institusi-pendidikan/package.json',
  'apps/dashboard-kementerian/package.json',
  'apps/dashboard-publik/package.json',
  'apps/transparansi-anggaran/apps/web-next/package.json',
  'apps/transparansi-anggaran/package.json',
  'package.json',
  'proxy/package.json'
];

const depMap = new Map();

pkgPaths.forEach(p => {
  if (fs.existsSync(p)) {
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    const processDeps = (deps, type) => {
      if (!deps) return;
      Object.keys(deps).forEach(name => {
        if (!depMap.has(name)) {
          depMap.set(name, { name, version: deps[name], usedIn: new Set([p]), type });
        } else {
          depMap.get(name).usedIn.add(p);
        }
      });
    };
    processDeps(data.dependencies, 'production');
    processDeps(data.devDependencies, 'development');
  }
});

// Search node_modules to find actual license, author, repo, and license file
const results = [];

function findPkgJsonInNodeModules(pkgName) {
  const possiblePaths = [
    path.join('node_modules', pkgName, 'package.json'),
    path.join('apps/transparansi-anggaran/node_modules', pkgName, 'package.json'),
    path.join('apps/dashboard-admin/node_modules', pkgName, 'package.json'),
    path.join('apps/dashboard-apbd/node_modules', pkgName, 'package.json'),
    path.join('apps/dashboard-auditor/node_modules', pkgName, 'package.json'),
    path.join('apps/dashboard-bank/node_modules', pkgName, 'package.json'),
    path.join('apps/dashboard-institusi-pendidikan/node_modules', pkgName, 'package.json'),
    path.join('apps/dashboard-kementerian/node_modules', pkgName, 'package.json'),
    path.join('apps/dashboard-publik/node_modules', pkgName, 'package.json'),
    path.join('proxy/node_modules', pkgName, 'package.json')
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        return { data: JSON.parse(fs.readFileSync(p, 'utf8')), dir: path.dirname(p) };
      } catch (e) {}
    }
  }
  return null;
}

for (const [name, info] of depMap.entries()) {
  const found = findPkgJsonInNodeModules(name);
  if (found) {
    const d = found.data;
    let repoUrl = '';
    if (typeof d.repository === 'string') repoUrl = d.repository;
    else if (d.repository && d.repository.url) repoUrl = d.repository.url;
    repoUrl = repoUrl.replace(/^git\+/, '').replace(/\.git$/, '');

    let authorStr = '';
    if (typeof d.author === 'string') authorStr = d.author;
    else if (d.author && d.author.name) authorStr = d.author.name;

    // Check LICENSE file in package dir
    let licenseFileNotice = '';
    const files = fs.readdirSync(found.dir);
    const licFile = files.find(f => /^license|^licence|^notice/i.test(f));
    if (licFile) {
      const licContent = fs.readFileSync(path.join(found.dir, licFile), 'utf8');
      const firstFewLines = licContent.split('\n').slice(0, 5).join(' ').trim();
      licenseFileNotice = firstFewLines;
    }

    results.push({
      name,
      license: d.license || 'Unknown',
      author: authorStr,
      repository: repoUrl || d.homepage || '',
      description: d.description || '',
      type: info.type,
      usedIn: Array.from(info.usedIn),
      licenseNotice: licenseFileNotice
    });
  } else {
    results.push({
      name,
      license: 'Not Found in node_modules',
      author: '',
      repository: '',
      type: info.type,
      usedIn: Array.from(info.usedIn),
      licenseNotice: ''
    });
  }
}

results.sort((a, b) => a.name.localeCompare(b.name));
fs.writeFileSync('scripts/audit_results.json', JSON.stringify(results, null, 2));
console.log(`Audited ${results.length} packages successfully. Results written to scripts/audit_results.json`);
