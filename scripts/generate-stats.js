const fs = require('fs');
const path = require('path');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GITHUB_ACTOR_TOKEN;
const USERNAME = 'rjviernes620';

if (!GITHUB_TOKEN) {
  console.error('Error: GITHUB_TOKEN environment variable is not set.');
  process.exit(1);
}

const query = `
query {
  user(login: "${USERNAME}") {
    name
    login
    repositories(first: 100, ownerAffiliations: OWNER, isFork: false) {
      nodes {
        name
        stargazerCount
        forkCount
        languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
          edges {
            size
            node {
              name
              color
            }
          }
        }
      }
    }
    contributionsCollection {
      totalCommitContributions
      restrictedContributionsCount
    }
    pullRequests(states: [OPEN, MERGED, CLOSED]) {
      totalCount
    }
    issues(states: [OPEN, CLOSED]) {
      totalCount
    }
    followers {
      totalCount
    }
  }
}
`;

async function fetchStats() {
  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'NodeJS-Stats-Generator'
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`GitHub API returned status ${response.status}: ${await response.text()}`);
    }

    const json = await response.json();
    if (json.errors) {
      throw new Error(`GraphQL Errors: ${JSON.stringify(json.errors)}`);
    }

    return json.data.user;
  } catch (error) {
    console.error('Failed to fetch data from GitHub GraphQL API:', error);
    process.exit(1);
  }
}

function generateStatsSVG(user, totalStars, totalForks) {
  const commits = user.contributionsCollection.totalCommitContributions + user.contributionsCollection.restrictedContributionsCount;
  const prs = user.pullRequests.totalCount;
  const issues = user.issues.totalCount;
  const followers = user.followers.totalCount;
  const reposCount = user.repositories.nodes.length;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="495" height="195" viewBox="0 0 495 195">
  <defs>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#a855f7" />
    </linearGradient>
  </defs>
  <rect x="0.5" y="0.5" width="494" height="194" rx="10" fill="#0a0b10" stroke="#1f2029" stroke-width="1" />
  
  <!-- Title -->
  <text x="25" y="35" font-family="'Segoe UI', Ubuntu, sans-serif" font-weight="700" font-size="18" fill="#6366f1">Roel's GitHub Stats</text>
  
  <!-- Stats list -->
  <g font-family="'Segoe UI', Ubuntu, sans-serif" font-size="14" font-weight="500" fill="#f3f4f6">
    <!-- Total Stars -->
    <g transform="translate(25, 60)">
      <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97 1.902 4.907a.75.75 0 0 1-1.088.791L8 12.347l-3.949 2.076a.75.75 0 0 1-1.088-.79l1.902-4.908-3.046-2.97a.75.75 0 0 1 .416-1.279l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" fill="#a855f7" />
      <text x="25" y="12.5" fill="#f3f4f6">Total Stars:</text>
      <text x="170" y="12.5" font-weight="700" fill="#ffffff">${totalStars}</text>
    </g>

    <!-- Commits -->
    <g transform="translate(25, 85)">
      <path d="M10.5 7.75a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm4.25.75a.75.75 0 0 0 0-1.5h-1.5a4.002 4.002 0 0 0-7.5 0h-1.5a.75.75 0 0 0 0 1.5h1.5a4.002 4.002 0 0 0 7.5 0h1.5Z" fill="#a855f7" />
      <text x="25" y="12.5" fill="#f3f4f6">Total Commits (Yr):</text>
      <text x="170" y="12.5" font-weight="700" fill="#ffffff">${commits}</text>
    </g>

    <!-- PRs -->
    <g transform="translate(25, 110)">
      <path d="M7.177 3.073L9.573.677A.25.25 0 0 1 10 .854v4.292a.25.25 0 0 1-.427.177L7.177 2.927a.25.25 0 0 1 0-.354ZM1.25 2.5a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm-.75 8a2.25 2.25 0 1 1 3 2.122v-6.244a2.251 2.251 0 0 1-1.5 0v6.244A2.251 2.251 0 0 1 .5 10.5Z" fill="#a855f7" />
      <text x="25" y="12.5" fill="#f3f4f6">Total PRs:</text>
      <text x="170" y="12.5" font-weight="700" fill="#ffffff">${prs}</text>
    </g>

    <!-- Issues -->
    <g transform="translate(25, 135)">
      <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" fill="#a855f7" />
      <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z" fill="#a855f7" />
      <text x="25" y="12.5" fill="#f3f4f6">Total Issues:</text>
      <text x="170" y="12.5" font-weight="700" fill="#ffffff">${issues}</text>
    </g>

    <!-- Followers -->
    <g transform="translate(25, 160)">
      <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A7.77 7.77 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" fill="#a855f7" />
      <text x="25" y="12.5" fill="#f3f4f6">Followers:</text>
      <text x="170" y="12.5" font-weight="700" fill="#ffffff">${followers}</text>
    </g>
  </g>

  <!-- Circular Rank indicator on the right -->
  <g transform="translate(360, 95)">
    <circle cx="0" cy="0" r="45" fill="none" stroke="#1f2029" stroke-width="6" />
    <circle cx="0" cy="0" r="45" fill="none" stroke="url(#glow)" stroke-width="6" stroke-dasharray="283" stroke-dashoffset="40" />
    <text x="0" y="8" font-family="'Segoe UI', Ubuntu, sans-serif" font-weight="800" font-size="28" fill="#ffffff" text-anchor="middle">A+</text>
    <text x="0" y="62" font-family="'Segoe UI', Ubuntu, sans-serif" font-weight="600" font-size="11" fill="#f3f4f6" text-anchor="middle" fill-opacity="0.6">RANK</text>
  </g>
</svg>`;
}

function generateLanguagesSVG(languages) {
  const width = 495;
  const height = 195;
  const maxLangs = 6;
  const sorted = Object.entries(languages)
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, maxLangs);

  const totalSize = sorted.reduce((sum, [_, lang]) => sum + lang.size, 0);

  // Generate color bars
  let currentX = 25;
  const barWidth = width - 50;
  const barHeight = 10;
  let barElements = '';
  let legendElements = '';

  sorted.forEach(([name, lang], index) => {
    const pct = totalSize > 0 ? (lang.size / totalSize) * 100 : 0;
    const itemWidth = (pct / 100) * barWidth;
    
    // Draw bar segment
    barElements += `<rect x="${currentX}" y="60" width="${itemWidth}" height="${barHeight}" fill="${lang.color || '#555555'}" ${index === 0 ? 'rx="5" ry="5"' : ''} ${index === sorted.length - 1 ? 'rx="5" ry="5"' : ''} />`;
    // Cover middle joins
    if (index > 0 && index < sorted.length) {
      barElements += `<rect x="${currentX}" y="60" width="3" height="${barHeight}" fill="${lang.color || '#555555'}" />`;
    }
    currentX += itemWidth;

    // Draw Legend item (2 columns of 3)
    const col = index % 2;
    const row = Math.floor(index / 2);
    const legendX = 25 + col * 230;
    const legendY = 95 + row * 28;

    legendElements += `
    <g transform="translate(${legendX}, ${legendY})">
      <circle cx="6" cy="6" r="6" fill="${lang.color || '#555555'}" />
      <text x="20" y="10" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="13" font-weight="600" fill="#f3f4f6">${name}</text>
      <text x="140" y="10" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="13" font-weight="500" fill="#ffffff" fill-opacity="0.6">${pct.toFixed(1)}%</text>
    </g>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="10" fill="#0a0b10" stroke="#1f2029" stroke-width="1" />
  
  <!-- Title -->
  <text x="25" y="35" font-family="'Segoe UI', Ubuntu, sans-serif" font-weight="700" font-size="18" fill="#6366f1">Most Used Languages</text>

  <!-- Progress Bar -->
  <g>
    <rect x="25" y="60" width="${barWidth}" height="${barHeight}" fill="#111219" rx="5" ry="5" />
    ${barElements}
  </g>

  <!-- Legends -->
  <g>
    ${legendElements}
  </g>
</svg>`;
}

async function main() {
  console.log('Fetching GitHub profile stats...');
  const user = await fetchStats();

  let totalStars = 0;
  let totalForks = 0;
  const languages = {};

  user.repositories.nodes.forEach(repo => {
    totalStars += repo.stargazerCount;
    totalForks += repo.forkCount;

    repo.languages.edges.forEach(edge => {
      const name = edge.node.name;
      const color = edge.node.color;
      const size = edge.size;

      if (!languages[name]) {
        languages[name] = { size: 0, color };
      }
      languages[name].size += size;
    });
  });

  console.log('Generating SVGs...');
  const statsSVG = generateStatsSVG(user, totalStars, totalForks);
  const langsSVG = generateLanguagesSVG(languages);

  const assetsDir = path.join(__dirname, '..', 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  fs.writeFileSync(path.join(assetsDir, 'stats.svg'), statsSVG);
  fs.writeFileSync(path.join(assetsDir, 'languages.svg'), langsSVG);
  
  console.log('Stats cards generated successfully at assets/stats.svg and assets/languages.svg!');
}

main();
