/**
 * Cloudflare Pages Function — /en/project/:slug
 * Intercepts crawler requests (Googlebot, FB, LinkedIn, Twitter) and serves
 * static HTML with correct meta tags, OG tags, and JSON-LD for the given project.
 * Normal users pass through to the SPA (index.html).
 */
import { isProjectCrawler, getProjects, findByProjectSlug, renderProjectHtml } from '../../_lib/project-helpers';

export async function onRequest(context) {
  const { request, params } = context;
  const ua = request.headers.get('user-agent') || '';

  // Non-crawlers → SPA handles it
  if (!isProjectCrawler(ua)) {
    return context.next();
  }

  const slug = params.slug;
  if (!slug) return context.next();

  try {
    const { projects } = await getProjects();
    const project = findByProjectSlug(projects, slug);
    if (!project) return context.next(); // 404 → SPA

    const html = renderProjectHtml(project, 'en');
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
