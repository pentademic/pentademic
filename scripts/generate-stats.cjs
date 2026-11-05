const fs = require('node:fs');
const path = require('node:path');
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function card(title, rows, note) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="520" height="250" viewBox="0 0 520 250" role="img" aria-label="' + esc(title) + '">' +
    '<rect width="520" height="250" rx="12" fill="#111827"/>' +
    '<g font-family="Arial,sans-serif"><text x="24" y="36" fill="#38bdf8" font-size="20" font-weight="bold">' + esc(title) + '</text>' +
    rows.map(([label,value], i) => '<text x="24" y="' + (75+i*32) + '" fill="#94a3b8" font-size="15">' + esc(label) + '</text><text x="490" y="' + (75+i*32) + '" text-anchor="end" fill="#e2e8f0" font-size="18">' + esc(value) + '</text>').join('') +
    '<text x="24" y="230" fill="#94a3b8" font-size="11">' + esc(note) + '</text></g></svg>';
}
module.exports = async ({github, context, outputDir = 'dist-stats'}) => {
  const username = context.repo.owner;
  const {data:user} = await github.rest.users.getByUsername({username});
  const repos = await github.paginate(github.rest.repos.listForUser, {username, per_page:100, type:'owner'});
  const owned = repos.filter(r => !r.fork);
  const counts = {};
  for (const repo of owned) if (repo.language) counts[repo.language] = (counts[repo.language] || 0) + 1;
  const languages = Object.entries(counts).sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0])).slice(0,4);
  const stamp = new Date().toISOString().slice(0,10);
  fs.mkdirSync(outputDir,{recursive:true});
  fs.writeFileSync(path.join(outputDir,'github-stats.svg'), card(username + ' · GitHub stats', [
    ['Public repositories', user.public_repos],
    ['Stars · owned non-fork repos', owned.reduce((n,r) => n+r.stargazers_count,0)],
    ['Forks · owned non-fork repos', owned.reduce((n,r) => n+r.forks_count,0)],
    ['Followers',user.followers]
  ], 'Public GitHub data · updated ' + stamp));
  fs.writeFileSync(path.join(outputDir,'top-languages.svg'), card('Primary languages · repository count', languages.length ? languages : [['No public language data', '—']], 'Owned non-fork public repos · primary language only · ' + stamp));
};
