/**
 * Cloudflare Pages Function — shared OG helpers for article crawler rendering.
 */

const CRAWLER_UA = /facebookexternalhit|LinkedInBot|Twitterbot|twitterbot|Facebot|facebookcatalog|Slackbot|WhatsApp|TelegramBot|Pinterest|Discordbot|SkypeUriPreview|Iframely|w3c_validator|Googlebot/i;
const ARTICLES_URL = 'https://tmk-tunnel.pl/data/articles.json';
const BASE_URL = 'https://tmk-tunnel.pl';
const OG_IMAGE = '/assets/images/og-image.webp';
const FACE_IMAGE = '/assets/images/face.png';

export function isCrawler(ua) {
  return CRAWLER_UA.test(ua || '');
}

/**
 * Fetch articles data, with caching via fetch API.
 */
export async function getArticles() {
  const resp = await fetch(ARTICLES_URL);
  if (!resp.ok) return { articles: [] };
  const data = await resp.json();
  const articles = Array.isArray(data) ? data : (data.articles || []);
  return { ...data, articles };
}

/**
 * Find article by slug. Returns null if not found.
 */
export function findBySlug(articles, slug) {
  return articles.find(a => a.slugPl === slug || a.slugEn === slug) || null;
}

/**
 * Generate minimal HTML with correct OG tags for the given article.
 */
export function renderArticleHtml(article, lang) {
  const title = lang === 'en' ? (article.titleEn || article.titlePl) : (article.titlePl || article.titleEn);
  const excerpt = lang === 'en' ? (article.excerptEn || article.excerptPl) : (article.excerptPl || article.excerptEn);
  const body = lang === 'en' ? (article.bodyEn || article.bodyPl) : (article.bodyPl || article.bodyEn);
  const slug = lang === 'en' ? (article.slugEn || article.slugPl) : (article.slugPl || article.slugEn);
  const articleUrl = lang === 'en' ? `${BASE_URL}/en/article/${slug}` : `${BASE_URL}/artykul/${slug}`;
  const date = article.date || '';

  // Strip HTML tags for description
  const plainExcerpt = (excerpt || '').replace(/<[^>]*>/g, '').trim().substring(0, 300);
  const plainBody = (body || '').replace(/<[^>]*>/g, '').trim().substring(0, 500);

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': title,
    'description': plainExcerpt || plainBody,
    'datePublished': date,
    'author': {
      '@type': 'Person',
      'name': 'Krystian "Krycha"',
      'url': BASE_URL
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'TMK Suite',
      'url': BASE_URL,
      'logo': {
        '@type': 'ImageObject',
        'url': BASE_URL + '/assets/images/logo-hero.webp'
      }
    },
    'mainEntityOfPage': { '@type': 'WebPage', '@id': articleUrl },
    'image': BASE_URL + OG_IMAGE
  };

  const escapedTitle = escHtml(title);
  const escapedExcerpt = escHtml(plainExcerpt || plainBody);

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <title>${escapedTitle} — TMK Suite</title>
  <meta name="description" content="${escapedExcerpt}">
  <meta property="og:title" content="${escapedTitle}">
  <meta property="og:description" content="${escapedExcerpt}">
  <meta property="og:url" content="${articleUrl}">
  <meta property="og:image" content="${BASE_URL}${OG_IMAGE}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="TMK Suite">
  <meta property="article:published_time" content="${date}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapedTitle}">
  <meta name="twitter:description" content="${escapedExcerpt}">
  <meta name="twitter:image" content="${BASE_URL}${OG_IMAGE}">
  <link rel="canonical" href="${articleUrl}">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <style>body{font-family:Inter,sans-serif;background:#0a0c10;color:#e6edf3;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center}a{color:#d4a843}</style>
</head>
<body>
  <div>
    <h1>${escapedTitle}</h1>
    <p>${escapedExcerpt}</p>
    <p style="color:rgba(230,237,243,0.3)"><a href="${articleUrl}">${articleUrl}</a></p>
  </div>
</body>
</html>`;
}

function escHtml(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
