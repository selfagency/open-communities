import { HttpResponse, http } from 'msw';

import { allCongregations, congregationMetaViews, findCongregationById } from '../../data/congregations';

const PB = 'http://*:8090';

export const congregationHandlers = [
  // GET /api/collections/congregationMeta/records — list congregations (the view)
  http.get(`${PB}/api/collections/congregationMeta/records`, ({ request }) => {
    const url = new URL(request.url);
    const filter = url.searchParams.get('filter') ?? '';
    const page = parseInt(url.searchParams.get('page') ?? '1', 10);
    const perPage = parseInt(url.searchParams.get('perPage') ?? '50', 10);

    let items = congregationMetaViews;

    // Honor the visible filter for non-admins
    if (filter.includes('visible=1') || filter.includes('visible=true')) {
      items = items.filter((c) => c.visible);
    }

    return HttpResponse.json({
      items: items.slice((page - 1) * perPage, page * perPage),
      page,
      perPage,
      totalItems: items.length,
      totalPages: Math.ceil(items.length / perPage)
    });
  }),

  // GET /api/collections/congregationMeta/records/:id — single congregation
  http.get(`${PB}/api/collections/congregationMeta/records/:id`, ({ params }) => {
    const cong = findCongregationById(params.id as string);
    if (!cong) {
      return HttpResponse.json({ code: 404, data: {}, message: "The resource wasn't found." }, { status: 404 });
    }
    return HttpResponse.json(cong);
  }),

  // POST /api/collections/congregations/records — create
  http.post(`${PB}/api/collections/congregations/records`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newCong = {
      collectionId: 'pbc_congregations',
      collectionName: 'congregations',
      created: new Date().toISOString(),
      id: 'rec_' + Math.random().toString(36).slice(2, 17),
      updated: new Date().toISOString(),
      ...body
    };
    allCongregations.push(newCong as CongregationFixture & Record<string, unknown>);
    return HttpResponse.json(newCong);
  }),

  // PATCH /api/collections/congregations/records/:id — update
  http.patch(`${PB}/api/collections/congregations/records/:id`, async ({ params, request }) => {
    const idx = allCongregations.findIndex((c) => c.id === params.id);
    if (idx === -1) {
      return HttpResponse.json({ code: 404, data: {}, message: "The resource wasn't found." }, { status: 404 });
    }
    const body = (await request.json()) as Record<string, unknown>;
    allCongregations[idx] = {
      ...allCongregations[idx],
      ...body,
      updated: new Date().toISOString()
    } as CongregationFixture & Record<string, unknown>;
    return HttpResponse.json(allCongregations[idx]);
  }),

  // DELETE /api/collections/congregations/records/:id — delete
  http.delete(`${PB}/api/collections/congregations/records/:id`, ({ params }) => {
    const idx = allCongregations.findIndex((c) => c.id === params.id);
    if (idx === -1) {
      return HttpResponse.json({ code: 404, data: {}, message: "The resource wasn't found." }, { status: 404 });
    }
    allCongregations.splice(idx, 1);
    return HttpResponse.json({ acknowledge: true });
  })

  // Child-table endpoints: GET /api/collections/{childTable}/records
  // These are handled generically, returning all records in the collection.
];

// Generic child-table list handlers (accessibility, fit, health, etc.)
const childTableNames = ['accessibility', 'fit', 'health', 'registration', 'security', 'services'];

// Lazy-import child table data to avoid circular deps
import { childTableMap } from '../../data/child-tables';

export const childTableHandlers = childTableNames.map((tableName) =>
  http.get(`${PB}/api/collections/${tableName}/records`, () => {
    const records = childTableMap[tableName] ?? [];
    return HttpResponse.json({
      items: records,
      page: 1,
      perPage: 50,
      totalItems: records.length,
      totalPages: 1
    });
  })
);
