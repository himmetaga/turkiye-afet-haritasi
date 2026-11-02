// functions/_middleware.ts
// Cloudflare Pages Edge Middleware — Technical SEO, Bot Optimization & Canonical Enforcement

interface Env {}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, next } = context;
  const url = new URL(request.url);

  // 1. Remove duplicate trailing slash (except root) to prevent duplicate content penalty
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
    return Response.redirect(url.toString(), 301);
  }

  // 2. Fetch page through Cloudflare static assets
  const response = await next();

  // If response is not HTML, return as-is
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return response;
  }

  // 3. Inject Search Engine Crawler & Security Headers
  const newHeaders = new Headers(response.headers);
  newHeaders.set('X-Robots-Tag', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  newHeaders.set('Link', `<https://afet.live${url.pathname}>; rel="canonical"`);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
};

