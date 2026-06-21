import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createMockRequestEvent } from "$test/testUtils";

import { congregationMetaViews } from "../../mocks/data/congregations";
import { countries } from "../../mocks/data/locations";

// Use wildcard host:port to match PocketBase regardless of localhost/127.0.0.1 resolution
const PB = "http://*:8090";

const server = setupServer(
	// GET congregationMeta/records — for the home page congregation list
	http.get(`${PB}/api/collections/congregationMeta/records`, () =>
		HttpResponse.json({
			items: congregationMetaViews,
			page: 1,
			perPage: 50,
			totalItems: congregationMetaViews.length,
			totalPages: 1,
		}),
	),
	// GET countries/records — for the layout data
	http.get(`${PB}/api/collections/countries/records`, () =>
		HttpResponse.json({
			items: countries,
			page: 1,
			perPage: 50,
			totalItems: countries.length,
			totalPages: 1,
		}),
	),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("server route modules smoke tests", () => {
	it("root load returns expected keys", async () => {
		const mod = await import("../../routes/+page.server");

		// Use a real PocketBase client — it makes HTTP requests that MSW intercepts
		const { createApi } = await import("../../lib/server/api");
		const api = createApi();

		const args = {
			fetch: globalThis.fetch.bind(globalThis),
			locals: { api },
		} as unknown as Parameters<typeof mod.load>[0];

		const result = await mod.load(args);
		expect(result).toHaveProperty("congregations");
		expect(result.congregations).toHaveLength(congregationMetaViews.length);
	});

	it("logout action clears cookies", async () => {
		const mod = await import("../../routes/logout/+page.server");
		const cookies = {
			delete: () => {},
			get: () => "",
			getAll: () => [{}] as { name: string; value: string }[],
			serialize: () => "",
			set: () => {},
		};
		const locals = {
			api: { authStore: { clear: () => {} } },
			cookieOpts: {},
		} as App.Locals;
		const mockActionEvent = createMockRequestEvent({
			cookies,
			locals,
			route: { id: "/logout" },
			url: new URL("http://localhost/logout"),
		});

		const res = await mod.actions.logout(mockActionEvent as any);
		expect(res).toEqual({});
	});
});
