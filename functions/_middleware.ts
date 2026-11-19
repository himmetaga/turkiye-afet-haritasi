// functions/_middleware.ts
// Cloudflare Pages Edge Middleware — kanonik URL (sondaki '/' kaldırılır).
//
// Dizine ekleme ve kanonik adres HTML'deki <meta name="robots"> ve
// <link rel="canonical"> etiketlerine bırakılır. Eskiden burada her HTML
// yanıtına "X-Robots-Tag: index" ve yol bazlı "Link: canonical" başlığı
// ekleniyordu; bu, noindex sayfalar, takma ad yolları ve 404 sayfasıyla
// çelişen sinyal üretiyordu.

interface Env {}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, next } = context;
  const url = new URL(request.url);

  // Remove duplicate trailing slash (except root) to prevent duplicate content
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
    return Response.redirect(url.toString(), 301);
  }

  return next();
};
