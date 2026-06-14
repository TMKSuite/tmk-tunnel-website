/**
 * Cloudflare Worker — proxy do GitHub API dla panelu admina tmk-tunnel.pl
 *
 * Deploy:
 *   1. Otwórz Cloudflare Dashboard → Workers & Pages → Create Worker
 *   2. Wklej ten plik
 *   3. Dodaj zmienne środowiskowe:
 *      ADMIN_SECRET  — hasło do panelu admina (min. 16 znaków)
 *      GITHUB_TOKEN  — GitHub PAT z scope `repo`
 *      GITHUB_REPO   — "TMKSuite/tmk-tunnel-website"
 *   4. Deploy
 *   5. Ustaw custom domain lub użyj domyślnego URL (np. admin-proxy.tmk-suite.workers.dev)
 *   6. Wpisz URL Workera w admin.html (zmienna WORKER_URL)
 */

export default {
  async fetch(request, env) {
    // ── CORS preflight ──
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders()
      });
    }

    const url = new URL(request.url);

    // ── Tylko POST na /api/admin/commit ──
    if (request.method !== 'POST' || url.pathname !== '/api/admin/commit') {
      return new Response('Not Found', { status: 404, headers: corsHeaders() });
    }

    // ── Parsuj body ──
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
      });
    }

    const { file, content, message, secret } = body;

    // ── Walidacja ──
    if (!secret || secret !== env.ADMIN_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
      });
    }

    if (!file || !content || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields: file, content, message' }), {
        status: 400,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
      });
    }

    // Dozwolone ścieżki — konkretne pliki lub prefix dla obrazków
    const allowedPaths = [
      'data/articles.json',
      'data/news.json',
      'data/about.json',
      'data/contact.json',
      'data/projects.json',
      'data/ideas.json',
      'data/home.json',
      'sitemap.xml'
    ];
    const isImageUpload = file.startsWith('assets/images/articles/') || file.startsWith('assets/images/');
    if (!allowedPaths.includes(file) && !isImageUpload) {
      return new Response(JSON.stringify({ error: 'File not allowed: ' + file }), {
        status: 403,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
      });
    }

    const repo = env.GITHUB_REPO || 'TMKSuite/tmk-tunnel-website';
    const token = env.GITHUB_TOKEN;

    if (!token) {
      return new Response(JSON.stringify({ error: 'Worker not configured: GITHUB_TOKEN missing' }), {
        status: 500,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
      });
    }

    try {
      // ── Weryfikuj token GitHub ──
      if (!token || token.length < 10) {
        throw new Error('GITHUB_TOKEN is missing or too short. Check Worker environment variables.');
      }
      if (!token.startsWith('ghp_') && !token.startsWith('github_pat_') && !token.startsWith('gho_')) {
        throw new Error('GITHUB_TOKEN does not look like a valid PAT (should start with ghp_, github_pat_, or gho_). Got: ' + token.substring(0, 4) + '...');
      }

      // ── Pobierz aktualny SHA pliku (jeśli istnieje) ──
      let sha = null;
      const getUrl = `https://api.github.com/repos/${repo}/contents/${file}`;
      const getResp = await fetch(getUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'tmk-tunnel-admin-worker',
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (getResp.ok) {
        const getData = await getResp.json();
        sha = getData.sha;
      } else if (getResp.status === 401 || getResp.status === 403) {
        const err = await getResp.text();
        throw new Error(`GitHub auth failed (${getResp.status}): token might be invalid or expired. ${err}`);
      } else if (getResp.status !== 404) {
        const err = await getResp.text();
        throw new Error(`GitHub GET ${file} failed: ${getResp.status} ${err.substring(0, 200)}`);
      }

      // ── Commit pliku ──
      // Base64 z obsługą UTF-8 (polskie znaki itp.)
      function toBase64(str) {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(str);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      }

      // Jeśli contentBase64=true, użyj contentu bezpośrednio (obrazek już zakodowany przez klienta)
      const contentBase64 = body.contentBase64 === true;
      const putBody = {
        message: message,
        content: contentBase64 ? content : toBase64(content),
        branch: 'master'
      };
      if (sha) {
        putBody.sha = sha;
      }

      const putUrl = `https://api.github.com/repos/${repo}/contents/${file}`;
      const putResp = await fetch(putUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'tmk-tunnel-admin-worker',
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(putBody)
      });

      if (!putResp.ok) {
        const errText = await putResp.text();
        let errMsg = `GitHub PUT failed (${putResp.status})`;
        if (putResp.status === 401 || putResp.status === 403) {
          errMsg += ': token might lack repo scope — check GITHUB_TOKEN permissions';
        } else if (putResp.status === 422) {
          errMsg += ': ' + errText.substring(0, 300);
        } else {
          errMsg += ': ' + errText.substring(0, 200);
        }
        throw new Error(errMsg);
      }

      const putData = await putResp.json();
      return new Response(JSON.stringify({
        success: true,
        file: file,
        sha: putData.content.sha,
        url: putData.content.html_url
      }), {
        status: 200,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
      });
    }
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': 'https://tmk-tunnel.pl',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
