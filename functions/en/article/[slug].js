/**
 * Cloudflare Pages Function — /en/article/:slug
 * Intercepts crawler requests (FB, LinkedIn, Twitter) and serves
 * static HTML with correct OG meta tags for the given article.
 * Normal users pass through to the SPA (index.html).
 */
import { isCrawler, getArticles, findBySlug, renderArticleHtml } from '../../_lib/og-helpers';

export async function onRequest(context) {
  const { request, params } = context;
  const ua = request.headers.get('user-agent') || '';

  // Non-crawlers → SPA handles it
  if (!isCrawler(ua)) {
    return context.next();
  }

  const slug = params.slug;
  if (!slug) return context.next();

  try {
    const { articles } = await getArticles();
    const article = findBySlug(articles, slug);
    if (!article) return context.next(); // 404 → SPA

    const html = renderArticleHtml(article, 'en');
    return new Response(html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=3600'
      }
    });
  } catch (e) {
    // On error, fall through to SPA
    return context.next();
  }
}
