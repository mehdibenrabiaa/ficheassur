import {getArticles, SITE_URL} from '@/lib/editorial';
export async function GET(request: Request) {
  // Read the request to generate this at runtime, including newly published articles.
  new URL(request.url);
  const urls = ['/', '/articles-et-guides', '/assistance', '/accessibilite'].map(path => ({url: SITE_URL + path, modified: ''}));
  let page = 1;
  while (true) {
    const result = await getArticles({page: String(page), limit: '100'});
    urls.push(...result.items.map(a => ({url: `${SITE_URL}/articles-et-guides/${a.slug}`, modified: a.updated_at})));
    if (page * result.limit >= result.total) break;
    page++;
  }
  const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u => `<url><loc>${escape(u.url)}</loc>${u.modified ? `<lastmod>${escape(u.modified)}</lastmod>` : ''}</url>`).join('')}</urlset>`, {headers: {'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=60'}});
}
