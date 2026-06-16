/**
 * Cloudflare Pages Function — shared helpers for project crawler rendering.
 */

const CRAWLER_UA = /facebookexternalhit|LinkedInBot|Twitterbot|twitterbot|Facebot|facebookcatalog|Slackbot|WhatsApp|TelegramBot|Pinterest|Discordbot|SkypeUriPreview|w3c_validator|Googlebot/i;
const PROJECTS_URL = 'https://tmk-tunnel.pl/data/projects.json';
const BASE_URL = 'https://tmk-tunnel.pl';
const OG_IMAGE = '/assets/images/og-image.webp';

export function isProjectCrawler(ua) {
  return CRAWLER_UA.test(ua || '');
}

export async function getProjects() {
  const resp = await fetch(PROJECTS_URL);
  if (!resp.ok) return { projects: [] };
  const data = await resp.json();
  return { ...data, projects: data.projects || [] };
}

export function findByProjectSlug(projects, slug) {
  return projects.find(p => p.slugPl === slug || p.slugEn === slug) || null;
}

export function renderProjectHtml(project, lang) {
  const title = lang === 'en'
    ? (project.name || '')
    : (project.name || '');
  // Prepend "TMK Suite — " but keep project name as is
  const pageTitle = title + ' — TMK Suite';
  const desc = lang === 'en'
    ? (project.descEn || '')
    : (project.descPl || '');
  const body = lang === 'en'
    ? (project.bodyEn || project.bodyPl || '')
    : (project.bodyPl || project.bodyEn || '');
  const slug = lang === 'en'
    ? (project.slugEn || project.slugPl)
    : (project.slugPl || project.slugEn);
  const projectUrl = lang === 'en'
    ? `${BASE_URL}/en/project/${slug}`
    : `${BASE_URL}/projekt/${slug}`;
  const iconImage = project.iconImage || '';
  const iconUrl = iconImage ? (iconImage.startsWith('/') ? BASE_URL + iconImage : iconImage) : '';
  const loc = project.loc || '';

  // Strip HTML tags for plain text description
  const plainDesc = (desc || '').replace(/<[^>]*>/g, '').trim().substring(0, 300);
  const ogDesc = plainDesc
    ? plainDesc + ' | Algotrading, handel ilościowy, automatyzacja TradingView.'
    : 'Projekt TMK Suite — algotrading, handel ilościowy, automatyzacja strategii TradingView.';

  // JSON-LD SoftwareApplication
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': project.name || '',
    'description': plainDesc,
    'url': projectUrl,
    'applicationCategory': 'BusinessApplication',
    'operatingSystem': 'Windows',
    'author': {
      '@type': 'Organization',
      'name': 'TMK Suite',
      'url': BASE_URL
    },
    'image': iconUrl || (BASE_URL + OG_IMAGE)
  };

  const escapedTitle = escHtml(pageTitle);
  const escapedDesc = escHtml(ogDesc);
  const escapedName = escHtml(project.name || '');

  // Render clean body (strip h3 to plain text, keep p/li structure)
  const cleanBody = (body || '').replace(/<h3[^>]*>/g, '<h2>').replace(/<\/h3>/g, '</h2>');
  const bodyExcerpt = cleanBody.substring(0, 8000); // Limit for crawler

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <title>${escapedTitle}</title>
  <meta name="description" content="${escapedDesc}">
  <meta property="og:title" content="${escapedTitle}">
  <meta property="og:description" content="${escapedDesc}">
  <meta property="og:url" content="${projectUrl}">
  <meta property="og:image" content="${BASE_URL}${OG_IMAGE}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="TMK Suite">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapedTitle}">
  <meta name="twitter:description" content="${escapedDesc}">
  <meta name="twitter:image" content="${BASE_URL}${OG_IMAGE}">
  <link rel="canonical" href="${projectUrl}">
  <link rel="alternate" hreflang="pl" href="${BASE_URL}/projekt/${project.slugPl || slug}">
  <link rel="alternate" hreflang="en" href="${BASE_URL}/en/project/${project.slugEn || slug}">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <style>
    body{font-family:Inter,sans-serif;background:#0a0c10;color:#e6edf3;margin:0;padding:2rem;max-width:900px;margin:0 auto;line-height:1.7}
    a{color:#d4a843;text-decoration:none}
    .nav{font-size:0.85rem;color:rgba(230,237,243,0.5);margin-bottom:2rem}
    .nav a{color:rgba(230,237,243,0.7)}
    .meta{display:flex;gap:1rem;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap}
    .meta span{font-size:0.8rem;color:rgba(230,237,243,0.4);background:rgba(255,255,255,0.04);padding:0.25rem 0.6rem;border-radius:4px}
    h1{font-family:'Space Grotesk',Inter,sans-serif;font-size:2rem;font-weight:700;color:#E6EDF3;margin-bottom:0.75rem}
    h2{font-family:'Space Grotesk',Inter,sans-serif;font-size:1.3rem;font-weight:600;color:#d4a843;margin-top:2rem;margin-bottom:0.5rem}
    p{color:rgba(230,237,243,0.85);margin-bottom:1rem}
    ul{color:rgba(230,237,243,0.85);padding-left:1.5rem}
    li{margin-bottom:0.5rem}
    strong{color:#E6EDF3}
    .desc{font-size:1.1rem;color:rgba(230,237,243,0.7);margin-bottom:2rem;border-left:3px solid #d4a843;padding-left:1rem}
    .cta{margin-top:2rem;padding:1rem;background:rgba(212,168,67,0.08);border:1px solid rgba(212,168,67,0.2);border-radius:8px;text-align:center}
    .cta a{font-weight:600;font-size:1.1rem}
    @media(max-width:600px){body{padding:1rem}h1{font-size:1.5rem}}
  </style>
</head>
<body>
  <div class="nav"><a href="${BASE_URL}">← TMK Suite</a></div>
  <h1>${escapedName}</h1>
  <div class="meta">
    <span>Python 3.13</span>
    <span>${escHtml(loc)} LOC</span>
    <span>Windows</span>
  </div>
  <div class="desc">${escapedDesc}</div>
  <div class="body">${bodyExcerpt}</div>
  <div class="cta">
    <a href="${projectUrl}">Zobacz pełną stronę projektu →</a>
  </div>
</body>
</html>`;
}

function escHtml(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
