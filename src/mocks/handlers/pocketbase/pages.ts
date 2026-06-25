import { HttpResponse, http } from 'msw';

import { allPages, pageVariants } from '../../data/pages';

// MSW mock handlers run locally — http is required
const PB = 'http://*:8090'; // NOSONAR

export const pageHandlers = [
  // GET /api/collections/pages/records — list with filter (by slug)
  http.get(`${PB}/api/collections/pages/records`, ({ request }) => {
    const url = new URL(request.url);
    const filter = url.searchParams.get('filter') ?? '';

    let items = allPages;

    // Handle PB filter: slug={:slug}
    const slugRe = /slug\s*=\s*['"]?(\S+?)['"]?\s*(?:$|&|\b)/;
    const slugMatch = slugRe.exec(filter);
    if (slugMatch) {
      items = items.filter((p) => p.slug === slugMatch[1]);
    }

    return HttpResponse.json({
      items,
      page: 1,
      perPage: 50,
      totalItems: items.length,
      totalPages: 1
    });
  }),

  // GET /api/collections/pages/records/:id
  http.get(`${PB}/api/collections/pages/records/:id`, ({ params }) => {
    const page = allPages.find((p) => p.id === params.id);
    if (!page) {
      return HttpResponse.json({ code: 404, data: {}, message: "The resource wasn't found." }, { status: 404 });
    }
    return HttpResponse.json(page);
  }),

  // GET /api/collections/pageVariants/records — list with filter
  http.get(`${PB}/api/collections/pageVariants/records`, ({ request }) => {
    const url = new URL(request.url);
    const filter = url.searchParams.get('filter') ?? '';

    let items = [...pageVariants];

    const pageRe = /page\s*=\s*['"]?(\S+?)['"]?\s/;
    const pageMatch = pageRe.exec(filter);
    if (pageMatch) {
      items = items.filter((v) => v.page === pageMatch[1]);
    }

    const langRe = /language\s*=\s*['"]?(\S+?)['"]?\s*(?:$|&|\b)/;
    const langMatch = langRe.exec(filter);
    if (langMatch) {
      items = items.filter((v) => v.language === langMatch[1]);
    }

    return HttpResponse.json({
      items,
      page: 1,
      perPage: 50,
      totalItems: items.length,
      totalPages: 1
    });
  })
];
