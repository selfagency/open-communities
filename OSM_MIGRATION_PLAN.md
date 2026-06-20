# Migration Plan: Local Location Database → OpenStreetMap APIs

**Repository:** `selfagency/open-communities`
**Date:** 2026-06-20
**Author:** Super Z (automated planning)
**Audience:** Project maintainers
**Status:** Proposal — awaiting approval before any code changes

---

## Executive Summary

This plan migrates Open Communities off its self-hosted PocketBase `countries` / `states` / `cities` tables and onto OpenStreetMap-backed APIs, while preserving all current user-facing functionality (cascading country → state → city dropdowns, map pins, location-based filtering, location-bound congregation records).

The migration is **not** a 1:1 swap. OSM is not a relational database, and the public Nominatim endpoint strictly forbids autocomplete-style queries (which is exactly what the current `Combobox` UI does). The plan therefore proposes a hybrid architecture:

- **Short-lived lookup cache** (PocketBase `osm_places` collection) for the countries/states/cities cascading dropdowns. Populated from OSM data via Overpass API + periodic planet extracts. This preserves the exact UX.
- **On-demand geocoding** via Nominatim (or self-hosted Pelias) for free-text location search as an optional future enhancement.
- **Map tiles** stay on CartoDB (already OSM-derived) — no change.
- **Congregation records** lose their `country`/`state`/`city` relation fields and gain a single `osm_place_id` (string) + denormalized `city_name` / `state_name` / `country_name` / `latitude` / `longitude` for display.

The plan is split into **6 phases** with clear rollback points. Total estimated effort: **3–5 engineer-weeks** for a careful, tested migration. A "fast path" that drops the cascading dropdown UX in favor of a single free-text search box can be done in **1 week** but is a UX regression; it's documented as Alternative B in the Appendix.

**Key risks:**
1. **Nominatim policy compliance** — public endpoint bans autocomplete, rate-limits to 1 req/sec, requires caching. The hybrid cache design exists primarily to satisfy this.
2. **Data migration** — existing ~N congregation records reference PocketBase record IDs for country/state/city. A one-time backfill must resolve those IDs to OSM place IDs (or to denormalized names) before cutover.
3. **Search UX divergence** — OSM place IDs are not stable across OSM data edits; a country boundary redraw can invalidate IDs. The cache must be refreshable.
4. **Self-hosting decision** — if request volume exceeds Nominatim's limits (likely once the directory grows past a few hundred congregations with active search), self-hosting Pelias or Nominatim becomes mandatory. This is a significant ops burden (40+ GB DB, regular planet updates).

**Final recommendation:** Proceed with the hybrid-cache approach (Phase 1 → 6 below). Self-hosting is deferred until usage data justifies it.

---

## 1. Current Architecture (As-Is)

### 1.1 Data Model

PocketBase collections involved in location:

| Collection | Type | Fields | Used For |
|---|---|---|---|
| `countries` | base | `id`, `name`, `code` (ISO 3166-1 alpha-2), `flag` (emoji), `latitude`, `longitude` | Country dropdown source |
| `states` | base | `id`, `name`, `code`, `country` (relation → `countries`), `latitude`, `longitude` | State dropdown source, filtered by selected country |
| `cities` | base | `id`, `name`, `state` (relation → `states`), `country` (relation → `countries`), `latitude`, `longitude` | City dropdown source, filtered by selected state |
| `congregations` | base | `…` + `country` (relation), `state` (relation), `city` (relation), `latitude`, `longitude` | Congregation records reference one of each |
| `congregationMeta` | view | `…` + `location` (JSON virtual field that expands the three relations into a nested `LocationMeta` shape) | Read-side convenience view |

PocketBase rules: `countries`/`states`/`cities` are read-only to non-admins (`createRule: null`, etc.). `congregations` allows create by verified users and update/delete by owner or admin.

### 1.2 Code Touchpoints

Files that read or write location data:

**Server-side (`src/lib/server/`, `src/routes/`):**
- `src/routes/+layout.server.ts:13-15` — loads ALL countries on every layout load via `api.collection('countries').getFullList({ fetch })`. Sent to client as `data.countries`.
- `src/routes/+page.server.ts:14-18` — loads all congregations with `filter: client?.admin ? '' : 'visible=1'`. Each congregation has expanded `location` (the `congregationMeta` view joins country/state/city).
- `src/routes/contact/+page.server.ts:22-33` — loads all congregations, builds combobox items with `city.name, state.name, country.name`.
- `src/routes/edit/+page.server.ts:38-83` — load handler: fetches the congregation meta, extracts `location.city.id`/`location.state.id`/`location.country.id` to seed the form's location fields.
- `src/routes/edit/+page.server.ts:167-296` — submit handler: writes `country`/`state`/`city` (relation IDs) and `latitude`/`longitude` back to the `congregations` collection via batch update.
- `src/routes/add/+page.server.ts:95-110` — submit handler: writes the same fields on congregation creation. Note line 107: `...location` spreads the form's `location` object (which contains `city`/`state`/`country` as string IDs) into the congregation record.
- `src/lib/location.ts` — `Location` class. `setCountry(input)` fetches `states?filter=country="${id}"`. `setState(input)` fetches `cities?filter=state="${id}"`. These are the cascading-dropdown data sources.

**Client-side (`src/lib/`, `src/lib/components/`):**
- `src/lib/components/form/segments/congregation.svelte:153-207` — the form's location section: three `Combobox` components for country/state/city, fed by `Location` service state. `handleCountryChange` → `setCountry` → triggers state list fetch → enables state combobox → etc.
- `src/lib/components/search/location.svelte:1-114` — the search filter UI: same three-combobox pattern, fed by the same `Location` service, but writes to `search.setSearchLocation()` instead of form data.
- `src/lib/components/search/map.svelte:1-107` — MapLibre map rendering pins. Reads `locations` (array of `{city, country, state, latitude, longitude}`) from the parent. Uses CartoDB basemap (already OSM-derived). `location.load({city, country, state})` is called on pin click to set the search location.
- `src/lib/components/search/congregations.svelte:81-102` — derives `locations` array from search results for the map. Uses `location.city?.latitude || location.state?.latitude || location.country?.latitude` for pin position (fallback chain).
- `src/lib/components/congregation/tile.svelte:57-70` — congregation card display: shows `location.city.name, location.state.name, location.country.name` as a comma-separated subtitle. Special-cases "United States" to hide the country.
- `src/lib/components/congregation/congregation.svelte` — full congregation detail view (similar location display logic).
- `src/lib/location.ts:1-178` — `Location` service class. Holds `state` (a nanostores `MapStore<LocationState>`) with `localities.countries`, `localities.states`, `localities.cities`, `locality.{country,state,city}`, `options.{countryOptions,stateOptions,cityOptions}`, `record.{country,state,city,latitude,longitude}`. Methods `setCountry`, `setState`, `setCity`, `load`, `reset`. Imports the shared `api` from `$lib/api` (client-side PocketBase instance).
- `src/lib/types.d.ts:1-69` — `LocationMeta`, `LocationRecord`, `LocationState`, `Localities`, `Locality`, `LocationOptions`, `City`, `Country`, `State` types.
- `src/lib/search.ts:36-49` — `Search` class filters congregations by `state.searchLocation.{city.id, country.id, state.id}`. Currently does strict ID equality on PocketBase record IDs.
- `src/lib/schemas/record.ts:72-76` — `defaultSchema` defines `location: z.object({ city: z.string().optional(), country: z.string().optional(), state: z.string().optional() })`. These are PocketBase record IDs.

**Tests:**
- `src/lib/location.test.ts` — tests the `Location` class.
- `src/lib/components/form/segments/congregation.behavior.test.ts` — tests the form segment.
- `src/lib/components/search/location.test.ts` — tests the search filter UI.
- `src/lib/components/search/map.test.ts` — tests the map component.
- `src/lib/components/search/congregations.test.ts` — tests the congregations list.
- `src/lib/components/congregation/tile.test.ts` — tests the congregation card.
- `src/lib/components/congregation/congregation.test.ts` — tests the congregation detail.
- `src/test/server/edit.page.server.test.ts` — tests the edit route.
- `src/test/server/add.page.server.test.ts` — tests the add route.
- `src/test/server/layout.server.test.ts` — tests the layout loader.

**Data import:**
- `util/import-locations.js` — script (not run in CI) that bulk-imports country/state/city data into PocketBase. The README mentions "you'll need to import a dump of the location data, which is a little large to contain in the repo, so be in touch."

### 1.3 What "User Functionality" Means

To preserve user functionality, the migration must keep all of the following working:

1. **Add-congregation form** — user selects country → state → city from three cascading dropdowns. The selected location is saved with the congregation record.
2. **Edit-congregation form** — same as add, but pre-populated with the congregation's existing location.
3. **Search filter** — on the home page, user filters the congregation list by country → state → city. Filtering is by exact ID match (current behavior) — equivalent behavior would be exact-place match.
4. **Map** — pins on the map represent congregations. Clicking a pin sets the search filter. Map center/zoom responds to the current search location.
5. **Congregation card** — displays city, state, country names below the congregation name.
6. **Congregation detail** — displays the same location info.
7. **Contact form** — congregations are listed in a combobox with `city, state, country` labels for the "claim" and "suggest" reasons.
8. **Performance** — current `getFullList` for countries is one DB query; the migration must not turn this into N HTTP calls per page load.

---

## 2. Target Architecture (To-Be)

### 2.1 OSM API Landscape (Verified via Wiki and Policy Docs)

OSM exposes several distinct APIs. The relevant ones for this migration:

| API | Purpose | Rate limit | Autocomplete? | Self-hostable? |
|---|---|---|---|---|
| **OSM Editing API v0.6** (`api.openstreetmap.org/api/0.6/`) | Read/write raw OSM elements (nodes, ways, relations). Not designed for app queries. | Tolerated for low-volume reads; intended for editors. | No | Yes (Rails port) |
| **Overpass API** (`overpass-api.de`, `overpass.kumi.systems`) | Query OSM elements by tags/geometry. The right tool for "give me all countries" or "give me all states in country X." | ~2 req/sec for public instances; varies by instance. | No | Yes (open source) |
| **Nominatim** (`nominatim.openstreetmap.org`) | Geocoding (name → coords) and reverse geocoding (coords → address). | **1 req/sec hard limit.** **No autocomplete allowed.** Must cache. Must send Referer/UA. | **Explicitly forbidden** | Yes (open source, ~40GB DB) |
| **Pelias** (open source) | Alternative geocoder with autocomplete support. | Self-hosted only. | Yes | Yes |
| **Map tiles** (e.g., CartoDB, OSM Deutschland) | Pre-rendered map image tiles. Already in use via CartoDB positron style. | Varies by provider | N/A | Yes (tileserver-gl) |

**Critical policy constraints from the Nominatim Usage Policy (verified):**
- "Auto-complete search — This is not yet supported by Nominatim and you must not implement such a service on the client side using the API." → The current Combobox-driven UX cannot be backed by Nominatim directly.
- "No heavy uses (an absolute maximum of 1 request per second)." → Even server-side, this is too slow for a cascading dropdown where each level change is a query.
- "Websites and Apps — Use that is directly triggered by the end-user (for example, user searches for something) is ok, provided that your number of users is moderate." → The directory is low-traffic enough to qualify, but only for genuine user-initiated single lookups.
- "Bulk Geocoding of larger amounts of data is not encouraged." → Cannot use Nominatim to populate the dropdown lists.
- "Results must be cached on your side." → Mandatory caching layer.
- "Provide a valid HTTP Referer or User-Agent identifying the application." → Must set custom UA.

**Conclusion:** The current cascading-dropdown UX is incompatible with calling Nominatim on every keystroke or even on every dropdown change. The solution is to **pre-cache the place hierarchy in our own database** (still PocketBase), populated from Overpass API periodically, and use Nominatim only for one-off forward/reverse lookups (e.g., map-click → nearest city).

### 2.2 Hybrid Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Client (browser)                                               │
│  - Combobox for country/state/city (unchanged UX)               │
│  - Map with pins (unchanged)                                    │
│  - Search filter by location (unchanged)                        │
└────────────┬────────────────────────────────────────────────────┘
             │ HTTPS (SvelteKit load/actions)
             ▼
┌─────────────────────────────────────────────────────────────────┐
│  SvelteKit server                                               │
│  - +layout.server.ts loads countries from local cache           │
│  - +page.server.ts loads congregations (now with denormalized   │
│    location names)                                              │
│  - add/edit actions write `osm_place_id` + denormalized names   │
│  - /api/lookup endpoint (NEW) for one-off Nominatim lookups     │
│    (e.g., map click → place name)                               │
└────────────┬────────────────────────────────────────────────────┘
             │
      ┌──────┴───────┐
      ▼              ▼
┌──────────┐   ┌──────────────────────┐
│ PocketBase │   │ OSM (one-off only)    │
│ - osm_places│   │ - Nominatim            │
│   (cache)  │   │   (1 req/sec, cached)  │
│ - congrega-│   │ - Overpass             │
│   tions    │   │   (for cache refresh)  │
│   (new     │   └──────────────────────┘
│   schema)  │
└────────────┘
```

### 2.3 New PocketBase Schema

Replace `countries`, `states`, `cities` with a single `osm_places` collection:

```jsonc
// osm_places collection
{
  "name": "osm_places",
  "type": "base",
  "fields": [
    { "name": "osm_id",    "type": "text", "required": true },  // e.g., "relation/1024051" for a country boundary
    { "name": "osm_type",  "type": "select", "values": ["node","way","relation"], "required": true },
    { "name": "place_type","type": "select", "values": ["country","state","region","city","town","suburb"], "required": true },
    { "name": "name",      "type": "text", "required": true },
    { "name": "name_local","type": "text" },                    // local-language name from OSM tags
    { "name": "iso_code",  "type": "text" },                    // ISO 3166-1 alpha-2 for countries, ISO 3166-2 for states
    { "name": "parent_osm_id", "type": "text" },                // references osm_places.osm_id of containing place
    { "name": "latitude",  "type": "number" },
    { "name": "longitude", "type": "number" },
    { "name": "bbox_min_lat","type":"number"},                  // bounding box for fast "is point in place" checks
    { "name": "bbox_min_lon","type":"number"},
    { "name": "bbox_max_lat","type":"number"},
    { "name": "bbox_max_lon","type":"number"},
    { "name": "population", "type": "number" },                  // for sort ordering
    { "name": "cached_at", "type": "autodate", "onCreate": true, "onUpdate": true }
  ],
  "indexes": [
    "CREATE UNIQUE INDEX `idx_osm_places_osm_id` ON `osm_places` (`osm_id`)",
    "CREATE INDEX `idx_osm_places_parent` ON `osm_places` (`parent_osm_id`)",
    "CREATE INDEX `idx_osm_places_type_parent` ON `osm_places` (`place_type`, `parent_osm_id`)"
  ],
  "listRule": "",
  "viewRule": "",
  "createRule": null,   // admin-only via background sync job
  "updateRule": null,
  "deleteRule": null
}
```

Update `congregations` collection:

```jsonc
// congregations collection (modified)
{
  // ... existing fields, EXCEPT:
  // REMOVE: "country", "state", "city"  (the three relation fields)
  // ADD:
  { "name": "osm_place_id", "type": "text" },                    // e.g., "relation/1234567" for the city
  { "name": "city_name",    "type": "text" },                    // denormalized for display + search
  { "name": "state_name",   "type": "text" },                    // denormalized
  { "name": "country_name", "type": "text" },                    // denormalized
  { "name": "country_code", "type": "text" },                    // ISO 3166-1 alpha-2, for flag emoji
  { "name": "latitude",     "type": "number" },                  // already exists, kept
  { "name": "longitude",    "type": "number" }                   // already exists, kept
}
```

The `congregationMeta` view is updated to project `location` as:

```jsonc
{
  "location": {
    "city":    { "id": "<osm_place_id>", "name": "<city_name>", "latitude": <lat>, "longitude": <lon> },
    "state":   { "id": "<parent_osm_id>", "name": "<state_name>", "latitude": <lat>, "longitude": <lon> },
    "country": { "id": "<grandparent_osm_id>", "name": "<country_name>", "code": "<country_code>", "latitude": <lat>, "longitude": <lon> },
    "latitude": <lat>,
    "longitude": <lon>
  }
}
```

This preserves the `LocationMeta` shape that the client `Search` class and components already consume — **the client code barely changes**. This is the key insight that makes the migration low-risk.

### 2.4 What Goes Where

| Concern | Before | After |
|---|---|---|
| Country list for dropdown | `countries` table, populated by manual import | `osm_places` filtered by `place_type='country'`, populated by Overpass sync |
| State list given a country | `states?filter=country="${id}"` | `osm_places?filter=place_type='state' && parent_osm_id="${country_osm_id}"` |
| City list given a state | `cities?filter=state="${id}"` | `osm_places?filter=place_type='city' && parent_osm_id="${state_osm_id}"` |
| Congregation's location | 3 relation fields (PB record IDs) | 1 `osm_place_id` + denormalized names |
| Map pin position | `congregation.location.city.latitude` (fallback chain) | `congregation.location.latitude` (already on the congregation record) |
| Map tiles | CartoDB positron | CartoDB positron (unchanged) |
| Free-text geocoding (NEW) | Not supported | Optional: `/api/lookup?q=...` server proxy to Nominatim, with cache + rate limit |
| Map-click → place name (NEW) | Not supported | Optional: `/api/reverse?lat=...&lon=...` server proxy to Nominatim |

---

## 3. Phase-by-Phase Migration Plan

Each phase is a separately reviewable PR. Each phase leaves the app in a working state. Each phase has a rollback.

### Phase 0: Preparation (1–2 days)

**Goal:** Set up tooling and data sources before touching app code.

#### Tasks

0.1 **Choose OSM data source for cache population.** Options:
   - **(A) Overpass API queries** for country/state/city hierarchies. Pros: simple, targeted. Cons: queries can be slow for full planet; some public instances rate-limit aggressively.
   - **(B) OSM planet extract + `osmium` filtering** to extract `place=country`, `place=state`, `place=city` etc. Pros: complete, fast to query locally. Cons: requires ~70GB download for planet (or smaller extract from Geofabrik).
   - **(C) Pre-built extracts from the [Natural Earth](https://www.naturalearthdata.com/) dataset** (public domain) for countries/states, plus OSM for cities. Pros: clean, curated. Cons: Natural Earth's city list is much smaller than OSM.
   - **Recommendation:** Start with **(A) Overpass** for initial bootstrap, then switch to **(B) Geofabrik country extracts** for ongoing refreshes once the directory's geographic scope is clear. This avoids needing the full planet.

0.2 **Decide on self-hosting threshold.** Document the trigger: "If Nominatim lookups exceed 100/day averaged over a week, deploy a self-hosted Nominatim instance." Track via PostHog. Until then, use the public Nominatim with strict caching.

0.3 **Identify all congregations currently in the database.** Export them as JSON with their current `country`/`state`/`city` PocketBase record IDs and the corresponding `name`/`latitude`/`longitude` from the joined `countries`/`states`/`cities` tables. This becomes the input to the data migration script (Phase 3).

0.4 **Spin up a staging PocketBase instance** with both old and new schemas side-by-side. This is where the migration script runs and where QA happens.

#### Deliverables
- Decision document (in `/docs/osm-data-source.md`) recording choices from 0.1 and 0.2.
- Staging PocketBase instance accessible to the team.
- Exported `congregations-pre-migration.json` snapshot.

#### Rollback
N/A — preparation phase doesn't modify production.

---

### Phase 1: Add `osm_places` cache collection and sync job (3–5 days)

**Goal:** Stand up the new place cache alongside the existing `countries`/`states`/`cities` collections. Nothing in the app reads from it yet.

#### Tasks

1.1 **Add the `osm_places` collection** to `pb_schema.json` (schema in §2.3 above). Apply to staging PocketBase.

1.2 **Write `scripts/sync-osm-places.ts`** — a TypeScript CLI script (run via `tsx`) that:
   - Fetches countries via Overpass: `relation["boundary"="administrative"]["admin_level"="2"]`. (In OSM, `admin_level=2` is countries.)
   - For each country, fetches states: `relation["boundary"="administrative"]["admin_level"="4"](area:<country-area-id>)`. (`admin_level=4` is states/provinces in most countries; some countries use 3, 5, or 6 — the script must handle the per-country mapping. See [OSM admin_level wiki](https://wiki.openstreetmap.org/wiki/Tag:boundary%3Dadministrative).)
   - For each state, fetches cities: `relation["place"="city"](area:<state-area-id>)` plus `node["place"="city"]` etc. (Cities can be nodes or relations.)
   - Computes a representative `latitude`/`longitude` for each (centroid for relations, node coords for nodes).
   - Computes bounding box from `bounds` element.
   - Inserts/updates `osm_places` records via PocketBase admin auth.
   - Idempotent: re-running updates existing rows, doesn't duplicate.
   - Respects Overpass rate limits (1 req/sec, exponential backoff on 429/529).
   - Sends a descriptive User-Agent: `OpenCommunities/1.0 (https://opencommunities.info; contact@example.org)`.
   - Caches Overpass responses to disk for the duration of the sync run (so re-runs during development don't hit Overpass repeatedly).

1.3 **Wire the sync script into CI as a weekly cron** (GitHub Actions scheduled workflow). Use a PocketBase admin token stored in GitHub Secrets. Document the runbook for manual re-sync.

1.4 **Add a `/health/osm-places` endpoint** (server-only) that reports: total places, last sync timestamp, places per type. Useful for monitoring.

1.5 **Tests:**
   - Unit test the Overpass response parser with a fixture.
   - Integration test the sync script against a mock Overpass server.
   - Test that re-running the script doesn't duplicate records.

#### Deliverables
- `pb_schema.json` updated with `osm_places`.
- `scripts/sync-osm-places.ts`.
- `scripts/sync-osm-places.test.ts`.
- `.github/workflows/sync-osm.yml` scheduled workflow.
- Populated `osm_places` collection on staging (~250 countries, ~5,000 states, ~100,000+ cities depending on scope).

#### Rollback
Drop the `osm_places` collection. Remove the workflow. No production impact.

#### Risk
Overpass queries for full planet city lists can take 30+ minutes and may hit rate limits. Mitigation: run sync in chunks (one continent at a time), and use Geofabrik extracts as fallback if Overpass is unavailable.

---

### Phase 2: Add new congregation schema fields (2–3 days)

**Goal:** Add the new `osm_place_id`, `city_name`, `state_name`, `country_name`, `country_code` fields to `congregations` without removing the old relation fields. The app still reads/writes the old fields. The new fields are populated but unused.

#### Tasks

2.1 **Update `pb_schema.json`** to add the new fields to `congregations`. The old `country`/`state`/`city` relation fields stay. Apply to staging.

2.2 **Update `congregationMeta` view** to project the new `location` shape (§2.3) using the new denormalized fields. The view now has both old and new `location` data. (PocketBase views are SQL-defined; we can have a `location_new` JSON field alongside the existing `location` for the duration of the migration.)

2.3 **Regenerate TypeScript types** via `pnpm run build:types` (which runs `pocketbase-typegen`).

2.4 **Update `src/lib/types.d.ts`** — `LocationMeta`, `LocationRecord` types to include `osm_place_id` field. Keep backward compatibility with `id` (set `id = osm_place_id` in the view projection).

2.5 **Backfill script `scripts/backfill-osm-place-ids.ts`:** for each congregation:
   - Read its current `country`/`state`/`city` PocketBase record IDs.
   - Look up the corresponding `osm_places` row by joining on `name` + `place_type` + parent chain. (The original `countries`/`states`/`cities` records have `name`, `latitude`, `longitude` — use these to fuzzy-match against `osm_places`.)
   - For ambiguous matches, log a warning and skip (manual review).
   - Write `osm_place_id`, `city_name`, `state_name`, `country_name`, `country_code` to the congregation record.
   - Generate a report of unmatched congregations for manual fixup.

2.6 **Run the backfill on staging.** Verify 100% match rate (or document unmatched congregations and resolve manually — usually by fixing the original `countries`/`states`/`cities` data or by hand-mapping).

2.7 **Tests:**
   - Test the backfill script against a mock PocketBase with fixture data.
   - Test the `congregationMeta` view returns both old and new `location` shapes correctly.

#### Deliverables
- Updated `pb_schema.json` with both old and new congregation fields.
- Updated `congregationMeta` view definition.
- Regenerated `src/lib/pocketbase.d.ts`.
- Updated `src/lib/types.d.ts`.
- `scripts/backfill-osm-place-ids.ts` + tests.
- Staging congregations 100% backfilled.

#### Rollback
Remove the new fields from `congregations`. Revert the view. Regenerate types. The app still works on the old fields.

#### Risk
Fuzzy matching by name can produce wrong matches (e.g., "Springfield, IL" vs "Springfield, MO"). Mitigation: match by `name + parent name` (e.g., "Springfield" + "Illinois" + "United States") and require all three to match. For the few that don't match, manual review.

---

### Phase 3: Migrate reads to the new schema (3–4 days)

**Goal:** All client-facing code reads from the new `osm_places` cache and the new congregation fields. Writes still go to the old fields (which are kept in sync by a trigger or by the action code). This is a "shadow read" phase — old data is still authoritative, but reads come from the new path.

#### Tasks

3.1 **Update `src/lib/location.ts`** — `Location` class:
   - `setCountry(osmPlaceId)`: query `osm_places?filter=parent_osm_id="${osmPlaceId}" && place_type='state'` instead of `states?filter=country="${id}"`.
   - `setState(osmPlaceId)`: query `osm_places?filter=parent_osm_id="${osmPlaceId}" && place_type='city'` instead of `cities?filter=state="${id}"`.
   - `setCity(osmPlaceId)`: lookup the city's `osm_places` record, set `record.{city, country, state, latitude, longitude}` from it and its parent chain.
   - `load(record)`: same, but `record` now contains `osm_place_id` instead of three separate IDs.
   - The `countries` array passed to the constructor now comes from `osm_places?filter=place_type='country'` instead of the `countries` collection.
   - **Use `pb.filter()`** for all queries (this also fixes the filter-injection issue from the code review).

3.2 **Update `src/routes/+layout.server.ts`** — replace `api.collection('countries').getFullList()` with `api.collection('osm_places').getFullList({ filter: pb.filter('place_type = {:t}', { t: 'country' }) })`. **Cache the result** in a module-level variable with a 1-hour TTL (fixes the per-request `getFullList` performance issue from the code review).

3.3 **Update `src/routes/+page.server.ts`** — the `congregations` query is unchanged (it goes through `congregationMeta` view, which now returns the new `location` shape). But verify that the `cleanResponse` mapping still works with the new shape.

3.4 **Update `src/routes/edit/+page.server.ts` load handler** — `congregation.location` is now `{ city: { id, name, ... }, state: {...}, country: {...}, latitude, longitude }` where `id` is the OSM place ID. The form-seeding code on lines 56-63 stays the same (it already extracts `location.city.id` etc.).

3.5 **Update `src/routes/contact/+page.server.ts`** — the combobox item builder (lines 22-33) uses `c.location.city.name` etc., which is unchanged.

3.6 **Update `src/lib/search.ts`** — the `Search` class filters by `state.searchLocation.{city.id, country.id, state.id}`. These IDs are now OSM place IDs (strings like `"relation/1234567"`). The strict-equality filter still works because OSM place IDs are stable strings. **Add a test** that filtering by country OSM ID returns only congregations in that country.

3.7 **Update `src/lib/components/congregation/tile.svelte`** and `congregation.svelte` — display logic uses `location.city.name` etc., unchanged.

3.8 **Update `src/lib/components/search/map.svelte`** — pin position uses `location.latitude`/`location.longitude` directly (no more fallback chain). The `location.load({city, country, state})` call on pin click now takes OSM place IDs.

3.9 **Update `src/lib/schemas/record.ts`** — `location` schema:
   ```ts
   location: z.object({
     osm_place_id: z.string().optional(),
     // Keep city/state/country for backward compat during migration
     city: z.string().optional(),
     country: z.string().optional(),
     state: z.string().optional()
   })
   ```
   The form still submits the three-ID shape; the action handler maps them to a single `osm_place_id` on write.

3.10 **Tests:**
    - Update `src/lib/location.test.ts` to mock `osm_places` queries.
    - Update `src/test/server/layout.server.test.ts` to assert the new collection is queried.
    - Update `src/test/server/edit.page.server.test.ts` and `add.page.server.test.ts` to seed `osm_places` data in their mocks.
    - Add a test that verifies the cached countries list is reused across requests (TTL test).

#### Deliverables
- All read paths use `osm_places` and the new congregation fields.
- Old `country`/`state`/`city` relation fields on `congregations` are still written but no longer read by the client.
- `+layout.server.ts` caches the countries list (performance fix).
- All tests pass.

#### Rollback
Revert the read-side code changes. The old `countries`/`states`/`cities` collections are still populated and the old code paths still work.

#### Risk
If the `osm_places` cache is incomplete (e.g., a country is missing its states), users see broken dropdowns. Mitigation: monitor the `/health/osm-places` endpoint; alert if any country has zero states.

---

### Phase 4: Migrate writes to the new schema (2–3 days)

**Goal:** Form submissions write `osm_place_id` + denormalized names to `congregations`. The old `country`/`state`/`city` relation fields are still written (for safety) but will be removed in Phase 5.

#### Tasks

4.1 **Update `src/routes/add/+page.server.ts` submit action** — when creating a congregation:
   - Receive the form's `location: { city, country, state }` (these are now OSM place IDs from the dropdowns).
   - Fetch the city's `osm_places` row to get `name`, `latitude`, `longitude`, `parent_osm_id`.
   - Fetch the parent (state) `osm_places` row to get `name`.
   - Fetch the grandparent (country) `osm_places` row to get `name` and `iso_code`.
   - Write to `congregations`: `osm_place_id: city.osm_id, city_name, state_name, country_name, country_code, latitude, longitude`. Also write the old `country`/`state`/`city` fields (looked up by `osm_id` in `osm_places`) for backward compat.
   - Use a single batch query to fetch the three `osm_places` rows in parallel.

4.2 **Update `src/routes/edit/+page.server.ts` submit action** — same logic, but on update. Also handle the case where the user changed only the city (re-derive state and country from the new city's parent chain).

4.3 **Add server-side validation** that the submitted `osm_place_id` actually exists in `osm_places` and is of type `city`. Reject otherwise (defends against stale dropdown options).

4.4 **Update `src/lib/schemas/record.ts`** — the `location` schema is now:
   ```ts
   location: z.object({
     osm_place_id: z.string().optional(),
     city: z.string().optional(),  // OSM place ID of the city
     country: z.string().optional(), // OSM place ID of the country (derived)
     state: z.string().optional()   // OSM place ID of the state (derived)
   })
   ```
   The client still sends all three for backward compat; the server uses `city` as the source of truth and derives the others.

4.5 **Tests:**
   - Update `add.page.server.test.ts` and `edit.page.server.test.ts` to assert the new fields are written.
   - Test that submitting an invalid `osm_place_id` returns a 400.
   - Test that changing the city correctly re-derives state and country.

#### Deliverables
- All congregation writes use the new schema.
- Old relation fields still written for safety.
- All tests pass.

#### Rollback
Revert the write-side changes. New congregations created during Phase 4 will have both old and new fields populated; congregations created after rollback will only have old fields. Re-run the backfill script (Phase 2.5) to populate new fields for any congregations created during Phase 4.

#### Risk
If the `osm_places` lookup fails mid-write (e.g., OSM place ID no longer exists due to a boundary merge), the write fails. Mitigation: handle the failure gracefully — log it, return a user-friendly error, and offer the user a chance to re-select their location from the (refreshed) dropdown.

---

### Phase 5: Cutover — remove old schema (1–2 days)

**Goal:** Remove the old `country`/`state`/`city` relation fields from `congregations` and drop the `countries`, `states`, `cities` collections. The app now fully runs on the new schema.

**Prerequisite:** Phase 4 has been in production for at least 1 week with no incidents. All congregations have valid `osm_place_id` and denormalized names.

#### Tasks

5.1 **Update `pb_schema.json`:**
   - Remove `country`, `state`, `city` relation fields from `congregations`.
   - Remove `countries`, `states`, `cities` collections.
   - Update `congregationMeta` view to use only the new fields.

5.2 **Regenerate TypeScript types** via `pnpm run build:types`.

5.3 **Clean up code:**
   - Remove backward-compat code paths added in Phase 3 and 4.
   - Remove the `Location` class's fallback logic for old-style IDs.
   - Simplify the `location` schema in `src/lib/schemas/record.ts` to just `osm_place_id`.
   - Remove the `countries` import from `+layout.server.ts` (now `osm_places`).
   - Remove the `util/import-locations.js` script (no longer needed).
   - Remove old `countries`/`states`/`cities` test fixtures and mocks.

5.4 **Update `src/lib/types.d.ts`:** remove `City`, `Country`, `State` types (replaced by a single `OsmPlace` type). Update `LocationMeta`, `LocationRecord`, `LocationState`, `Localities`, `Locality`, `LocationOptions` accordingly.

5.5 **Update tests:** all mocks and fixtures now use `osm_places`. Remove `src/test/mocks/...` entries that referenced old collections.

5.6 **Update the README:** remove the "you'll need to import a dump of the location data" instruction. Replace with "the location cache is auto-populated by the sync script; see `docs/osm-data-source.md`."

5.7 **Production cutover:**
   - Take a backup of PocketBase.
   - Apply the schema migration.
   - Deploy the new app code.
   - Smoke-test: add a congregation, edit it, search by location, view the map.
   - Monitor error logs for 24 hours.

#### Deliverables
- Old collections and fields removed.
- Code cleaned up.
- README updated.
- Production cutover complete.

#### Rollback
**Difficult.** Once the old collections are dropped, the old data is gone (unless backed up). Rollback requires:
1. Restore PocketBase from the pre-cutover backup.
2. Revert the app code to the Phase 4 state.
3. Re-run the Phase 4 backfill (which is now a no-op since the backup has the old data).

This is why Phase 5 requires Phase 4 to be stable for a week first.

#### Risk
Unnoticed code paths that still reference old fields will fail at runtime. Mitigation: TypeScript will catch most of these after the type regeneration. For runtime safety, run the full e2e test suite against the cutover branch before deploying.

---

### Phase 6: Optional enhancements (deferred)

These are not required for migration but become possible once the new architecture is in place.

#### 6.1 Free-text location search (Nominatim proxy)

Add a `+server.ts` endpoint at `/api/lookup?q=...` that:
- Accepts a query string (min 3 chars).
- Checks an in-memory LRU cache (keyed by query).
- If miss, calls Nominatim `search?q=...&format=jsonv2&addressdetails=1` with a custom User-Agent.
- Enforces 1 req/sec rate limit (server-side semaphore).
- Caches the result for 24 hours.
- Returns structured results: `[{ osm_id, osm_type, display_name, lat, lon, type, address: { city, state, country } }]`.

**Use case:** Replace the cascading dropdowns with a single "Search location" input on the search page. This is a UX improvement for power users but a regression for users who prefer browsing. Consider A/B testing.

**Cannot be used to back the existing Combobox** because the Combobox does client-side filtering on a pre-loaded list, not server-side queries on each keystroke. Nominatim policy explicitly forbids autocomplete. To do autocomplete, you'd need to self-host Pelias (which supports it) or use a commercial provider (Mapbox, Algolia Places, etc.).

#### 6.2 Reverse geocoding for map clicks

Add `/api/reverse?lat=...&lon=...` that calls Nominatim `reverse?lat=...&lon=...&format=jsonv2`. Use case: user clicks an empty spot on the map → reverse-geocode to nearest city → offer to filter by that city. Same caching and rate-limit rules apply.

#### 6.3 Self-hosted Nominatim or Pelias

If usage exceeds the public Nominatim limit (1 req/sec sustained), deploy a self-hosted instance:
- **Nominatim**: ~40 GB DB, requires periodic planet updates (~weekly). Significant ops burden.
- **Pelias**: ~100 GB+ DB, supports autocomplete, designed for app use. Heavier but more featureful.
- **Recommendation:** Pelias if autocomplete is desired; Nominatim if not. Both require a 4+ GB RAM server minimum.

Document the deployment in `docs/self-hosted-geocoding.md` when the time comes.

#### 6.4 Congregation boundary visualization

With OSM place IDs stored on congregations, you can fetch the country/state boundary GeoJSON from Overpass on demand and render it on the map as a highlight overlay when a user filters by that location. This is a nice UX touch.

#### 6.5 Improved cache refresh strategy

The Phase 1 sync script does a full refresh. For ongoing updates, consider:
- Subscribe to OSM replication diffs (minute/hour/day) and apply only changes to `osm_places`.
- This reduces sync time from 30+ minutes to seconds.
- Requires a persistent process (worker dyno or systemd service).

---

## 4. Data Migration Details

### 4.1 Place Hierarchy Mapping

OSM's `admin_level` tag is not globally consistent. The script must handle:

| Place type | OSM tag filter | Common `admin_level` values | Notes |
|---|---|---|---|
| Country | `boundary=administrative` + `admin_level=2` | 2 | Universally consistent. |
| State/Province | `boundary=administrative` + `admin_level=4` (most countries), `3` (some), `5` (some), `6` (some) | 3, 4, 5, 6 | Per-country mapping required. See [this table](https://wiki.openstreetmap.org/wiki/Tag:boundary%3Dadministrative#admin_level). |
| City | `place=city` (or `place=town` for smaller) | N/A (place tag, not admin_level) | Some large cities are also `boundary=administrative` with `admin_level=6` or `7`. |
| Town | `place=town` | N/A | Smaller than city. Include if directory scope includes them. |
| Suburb | `place=suburb` | N/A | Probably out of scope for congregations. |

**The sync script must apply a per-country admin_level mapping.** Hardcode the mapping for the top 20 countries by Jewish population (US, IL, CA, GB, FR, DE, AR, BR, AU, RU, UA, ZA, MX, NL, BE, HU, TR, IT, ES, SE). For other countries, default to `admin_level=4` for states and log a warning.

### 4.2 Place ID Stability

OSM place IDs (the numeric `osm_id` combined with `osm_type`, e.g., `"relation/1024051"`) are **mostly stable** but can change when:
- A boundary is merged with another (rare for countries, occasional for cities).
- A place is deleted from OSM (very rare for established places).
- A node is promoted to a relation or vice versa (occasional).

**Mitigation:**
- Store `osm_id` as a string with the type prefix (`"relation/1234567"`), not just the number.
- During sync, detect when an `osm_places` row no longer exists in OSM. Don't delete it immediately; mark it as `stale` and alert. After 30 days of staleness, archive it.
- For congregations referencing a stale `osm_place_id`, the display still works (we have denormalized names). The user can re-select their location if they edit the congregation.
- Provide an admin UI to manually remap a stale `osm_place_id` to a new one.

### 4.3 Backfill Matching Strategy

The Phase 2 backfill script must match existing `countries`/`states`/`cities` records to `osm_places` rows. Strategy:

1. **Exact match by name + parent name:** For a city named "Springfield" in state "Illinois" in country "United States", query `osm_places` for `name="Springfield" && place_type='city'` and filter results by parent.name="Illinois" and grandparent.name="United States".
2. **Fuzzy match** for non-exact matches (accents, diacritics, "St." vs "Saint"): use `radashi.similarity` or `ufuzzy`. Threshold: similarity > 0.85.
3. **Coordinate match** as fallback: if no name match, find the `osm_places` city within 10 km of the original `latitude`/`longitude`.
4. **Manual review** for the rest. Generate a CSV of unmatched congregations with their old location data.

Expected match rate: >95% on the first three strategies. The remaining <5% should be resolved manually before Phase 5 cutover.

---

## 5. Nominatim Compliance Checklist

If Phase 6.1 or 6.2 is implemented, the following must be true:

- [ ] Custom `User-Agent` header set to `OpenCommunities/1.0 (https://opencommunities.info; contact@opencommunities.info)`. (Required by policy.)
- [ ] Custom `Referer` header set to `https://opencommunities.info/`. (Required by policy.)
- [ ] Server-side rate limiter: max 1 req/sec, enforced via a semaphore. (Required.)
- [ ] LRU cache with 24-hour TTL on all Nominatim responses. (Required: "Results must be cached on your side.")
- [ ] No client-side calls to Nominatim. All calls go through our `/api/lookup` or `/api/reverse` proxy. (Required: "you must not implement such a service on the client side.")
- [ ] No autocomplete-style usage. The proxy accepts a full query string, not per-keystroke queries. (Required: "Auto-complete search ... you must not implement such a service on the client side using the API.")
- [ ] Attribution displayed somewhere in the UI (footer: "Address data © OpenStreetMap contributors, ODbL 1.0"). (Required: "Clearly display attribution as suitable for your medium.")
- [ ] No bulk geocoding. The proxy is for one-off user-initiated lookups only. (Required.)
- [ ] No submission of personal data to Nominatim. Queries contain only place names, not user info. (Required: "Please do not submit personal data or other confidential material.")
- [ ] Monitoring: track Nominatim request count, error rate, cache hit rate. Alert if approaching 1 req/sec sustained.

---

## 6. Testing Strategy

### 6.1 Unit Tests

- `src/lib/server/osm-places.test.ts` — tests the cached `getCountries()`, `getStates(countryId)`, `getCities(stateId)` helpers.
- `src/lib/server/nominatim.test.ts` — tests the rate limiter, cache, and response parser (with mocked fetch).
- `src/lib/location.test.ts` — updated to mock `osm_places` queries.
- `scripts/sync-osm-places.test.ts` — tests the Overpass response parser, the per-country admin_level mapping, and idempotency.
- `scripts/backfill-osm-place-ids.test.ts` — tests the matching strategies (exact, fuzzy, coordinate, manual).

### 6.2 Integration Tests

- `src/test/server/layout.server.test.ts` — assert `osm_places` is queried, not `countries`.
- `src/test/server/add.page.server.test.ts` — assert new congregation has `osm_place_id` and denormalized names.
- `src/test/server/edit.page.server.test.ts` — assert changing city re-derives state/country.
- `src/test/server/contact.page.server.test.ts` — assert combobox items have correct labels from denormalized names.

### 6.3 E2E Tests

- Extend `e2e/tests/auth.spec.js` (or add `e2e/tests/location.spec.js`) with:
  - **Add congregation flow:** select country → state → city → submit → verify congregation appears with correct location.
  - **Edit congregation flow:** change city → submit → verify updated location.
  - **Search filter:** select country → verify filtered results.
  - **Map interaction:** click a pin → verify search location updates.
- Run e2e against a staging PocketBase with the `osm_places` collection pre-populated for at least the test countries.

### 6.4 Manual QA Checklist (Phase 5 cutover)

- [ ] Home page loads, countries dropdown populated.
- [ ] Selecting a country populates states dropdown.
- [ ] Selecting a state populates cities dropdown.
- [ ] Search filter narrows results correctly.
- [ ] Map pins appear at correct locations.
- [ ] Clicking a map pin sets the search filter.
- [ ] Add-congregation form saves location correctly.
- [ ] Edit-congregation form pre-populates and saves correctly.
- [ ] Congregation card displays "City, State, Country" correctly.
- [ ] Contact form combobox shows congregation labels correctly.
- [ ] No console errors related to `countries`/`states`/`cities`.
- [ ] No PocketBase errors in server logs.
- [ ] `/health/osm-places` reports reasonable counts.

---

## 7. Risk Register

| Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|
| Nominatim bans the app for policy violation | Medium | High (free-text search breaks) | Strict compliance checklist (§5). Default to no Nominatim usage (Phase 6 is optional). | Backend |
| Overpass sync fails or is rate-limited | Medium | Medium (stale cache) | Use multiple Overpass instances; fall back to Geofabrik extracts; alert on sync failure. | Backend |
| OSM place IDs change during migration | Low | Low (denormalized names still display) | Store names alongside IDs; provide admin remap UI. | Backend |
| Backfill matching produces wrong locations | Medium | High (congregations in wrong city) | Three-strategy matching + manual review; require 100% match rate before Phase 5. | Backend |
| Performance regression from `osm_places` queries | Low | Medium | Index `parent_osm_id` + `place_type`; cache countries list (Phase 3.2). | Backend |
| Existing tests break due to schema change | High | Low (test fix-up work) | Update all listed test files in Phase 3.10. | Frontend |
| User-reported "my city is missing" after cutover | Medium | Medium | Provide a "report missing location" link that emails admin; admin can manually add the city to `osm_places`. | Support |
| Self-hosting required sooner than expected | Low | High (ops burden) | Monitor Nominatim usage from day 1; have a runbook ready. | DevOps |

---

## 8. Rollback Strategy

### Phase 1 rollback
Drop `osm_places` collection. Remove sync workflow. No production impact.

### Phase 2 rollback
Remove new congregation fields. Revert `congregationMeta` view. Regenerate types. App still works on old schema.

### Phase 3 rollback
Revert read-side code to use `countries`/`states`/`cities`. The new fields are still populated but unused. No data loss.

### Phase 4 rollback
Revert write-side code. New congregations created during Phase 4 have both old and new fields. Re-run backfill to populate new fields for any congregations created after rollback (they'll only have old fields).

### Phase 5 rollback
**Hardest rollback.** Requires PocketBase backup restore + code revert. This is why Phase 5 requires a week of stable Phase 4 operation first.

### Phase 6 rollback
Each enhancement is independent and can be removed individually.

---

## 9. Timeline

| Phase | Duration | Dependency | Can parallelize? |
|---|---|---|---|
| Phase 0: Preparation | 1–2 days | None | — |
| Phase 1: osm_places cache + sync | 3–5 days | Phase 0 | — |
| Phase 2: New congregation fields + backfill | 2–3 days | Phase 1 | Yes (with Phase 1 if separate engineer) |
| Phase 3: Migrate reads | 3–4 days | Phases 1 + 2 | — |
| Phase 4: Migrate writes | 2–3 days | Phase 3 | — |
| Phase 5: Cutover | 1–2 days | Phase 4 + 1 week stable | — |
| Phase 6: Enhancements | Open-ended | Phase 5 | — |
| **Total (Phases 0–5)** | **12–19 days** | | |

With one engineer working full-time: ~3 weeks. With two engineers parallelizing Phases 1 and 2: ~2 weeks.

---

## 10. Appendix

### Appendix A: Alternative B — Free-text search only (UX regression)

**Skip the `osm_places` cache entirely. Replace the three-dropdown cascading UI with a single free-text search input backed by Nominatim (server-side proxy).**

Pros:
- 1 week of work instead of 3.
- No cache to maintain.
- Always uses fresh OSM data.
- Simpler schema: congregations store just `latitude`, `longitude`, and a denormalized `location_string` for display.

Cons:
- **Nominatim policy forbids autocomplete.** The search input must require the user to type a full place name and press Enter (or click Search). No dropdown-as-you-type.
- **Search filter UX changes.** Instead of "select country → select state → select city," users type "Brooklyn, NY" and hope Nominatim returns the right result. Less discoverable.
- **No cascading filter.** Can't browse "all congregations in New York State" without typing the state name.
- **Rate limit risk.** Even with 1 req/sec and caching, a popular app could hit the limit. Self-hosting becomes mandatory sooner.
- **Map pin clicks need reverse geocoding** to display a place name, which is another Nominatim call.

**Recommendation:** Only choose this alternative if the team explicitly prefers the UX and is willing to self-host Nominatim or Pelias from day 1. Otherwise, the hybrid-cache approach (Phase 1–5) preserves the existing UX and defers self-hosting.

### Appendix B: Alternative C — Use a commercial geocoder

Use Mapbox Geocoding API, Algolia Places, or Google Places API instead of OSM.

Pros:
- Autocomplete supported (unlike public Nominatim).
- Higher rate limits.
- SLA and support.
- No self-hosting burden.

Cons:
- **Cost.** Mapbox free tier: 100k requests/month. Algolia: 10k/month. Google: $17 per 1000 requests after free tier.
- **Vendor lock-in.** Switching later is painful.
- **License.** Commercial providers' terms may restrict derivative works. OSM data is ODbL (share-alike), which is more permissive for non-commercial use.
- **Privacy.** User search queries go to a third party.

**Recommendation:** Only if the team has budget and the UX requirements demand autocomplete. The OSM hybrid-cache approach gives autocomplete-like UX (because we control the dropdown data) without per-query API calls.

### Appendix C: OSM Admin Level Reference

The sync script's per-country `admin_level` mapping. This is a starting point; verify against [the OSM wiki](https://wiki.openstreetmap.org/wiki/Tag:boundary%3Dadministrative#admin_level) before implementation.

| Country | State level | Notes |
|---|---|---|
| United States | 4 | States |
| Canada | 4 | Provinces |
| United Kingdom | 4 (England regions), 5 (constituent countries), 6 (ceremonial counties), 8 (districts) | Complex; use level 6 for "state" |
| Australia | 4 | States |
| France | 4 (regions), 6 (departments), 7 (communes) | Use level 4 for "state" (régions) |
| Germany | 4 (Bundesländer) | States |
| Israel | 4 (districts) | Mehozot |
| Argentina | 4 | Provinces |
| Brazil | 4 | States |
| South Africa | 4 | Provinces |
| Russia | 4 | Federal subjects |
| Ukraine | 4 | Oblasts |
| Mexico | 4 | States |
| Netherlands | 4 | Provinces |
| Belgium | 4 | Regions |
| Hungary | 4 (regions), 5 (counties), 6 (districts), 8 (cities) | Use level 5 for "state" |
| Turkey | 4 | Provinces |
| Italy | 4 | Regions |
| Spain | 4 | Autonomous communities |
| Sweden | 4 | Counties |

For all other countries: default to `admin_level=4`, log a warning, and manually verify during the first sync.

### Appendix D: File Change Manifest

Files to create:
- `scripts/sync-osm-places.ts`
- `scripts/sync-osm-places.test.ts`
- `scripts/backfill-osm-place-ids.ts`
- `scripts/backfill-osm-place-ids.test.ts`
- `src/lib/server/osm-places.ts` (cached country/state/city helpers)
- `src/lib/server/osm-places.test.ts`
- `src/lib/server/nominatim.ts` (Phase 6 only)
- `src/lib/server/nominatim.test.ts` (Phase 6 only)
- `src/routes/api/lookup/+server.ts` (Phase 6 only)
- `src/routes/api/reverse/+server.ts` (Phase 6 only)
- `src/routes/health/osm-places/+server.ts`
- `docs/osm-data-source.md`
- `.github/workflows/sync-osm.yml`

Files to modify:
- `pb_schema.json` (add `osm_places`, modify `congregations`, eventually drop `countries`/`states`/`cities`)
- `src/lib/pocketbase.d.ts` (regenerated)
- `src/lib/types.d.ts` (update `LocationMeta`, `LocationRecord`, etc., add `OsmPlace`)
- `src/lib/location.ts` (query `osm_places` instead of `countries`/`states`/`cities`)
- `src/lib/location.test.ts`
- `src/lib/search.ts` (OSM place ID equality, no change to filter logic)
- `src/lib/search.test.ts`
- `src/lib/schemas/record.ts` (`location.osm_place_id`)
- `src/lib/schemas/children.ts` (no change expected)
- `src/routes/+layout.server.ts` (load from `osm_places`, add cache)
- `src/routes/+page.server.ts` (no change expected, goes through view)
- `src/routes/add/+page.server.ts` (write `osm_place_id` + denormalized names)
- `src/routes/edit/+page.server.ts` (same)
- `src/routes/contact/+page.server.ts` (no change expected)
- `src/routes/[slug]/+page.server.ts` (no change expected)
- `src/lib/components/form/segments/congregation.svelte` (no change expected — Location service abstracts the data source)
- `src/lib/components/search/location.svelte` (no change expected)
- `src/lib/components/search/map.svelte` (simplify: use `location.latitude` directly)
- `src/lib/components/search/congregations.svelte` (no change expected)
- `src/lib/components/congregation/tile.svelte` (no change expected)
- `src/lib/components/congregation/congregation.svelte` (no change expected)
- `src/test/server/layout.server.test.ts`
- `src/test/server/add.page.server.test.ts`
- `src/test/server/edit.page.server.test.ts`
- `src/test/server/contact.page.server.test.ts`
- `src/test/server/routes.server.test.ts`
- `src/test/server/routes.page.server.test.ts`
- `src/lib/components/search/location.test.ts`
- `src/lib/components/search/map.test.ts`
- `src/lib/components/search/congregations.test.ts`
- `src/lib/components/form/segments/congregation.behavior.test.ts`
- `src/lib/components/congregation/tile.test.ts`
- `src/lib/components/congregation/congregation.test.ts`
- `src/test/mocks/$env/dynamic/public.js` (add `PUBLIC_OSM_PROXY_ENABLED`)
- `src/test/mocks/$env/static/public.js` (same)
- `README.md` (remove location-import instruction, add OSM attribution)
- `package.json` (add `tsx` for running TS scripts; add `sync:osm-places` and `backfill:osm-places` scripts)
- `.env.example` (new file, document all env vars including OSM-related ones)

Files to delete (Phase 5):
- `util/import-locations.js`
- Any test fixtures referencing `countries`/`states`/`cities` collections

---

## 11. Open Questions

These should be resolved before Phase 1 implementation begins:

1. **Geographic scope:** Should the `osm_places` cache include every country and every city globally, or only countries with significant Jewish population? Global is more inclusive but slower to sync and larger in storage. Recommend: global for countries, but only cities with population > 1,000 (filter via OSM `population` tag) to keep the cities table manageable.

2. **Town vs city:** Should the directory include `place=town` (smaller than city)? Some congregations may be in towns too small to be tagged `place=city`. Recommend: include both `city` and `town` in the sync, with `place_type` distinguishing them.

3. **Neighborhoods/suburbs:** For large cities (NYC, London), users may want to filter by neighborhood (Brooklyn, Manhattan). OSM has `place=suburb` for these. Should the cache include them? Recommend: defer to Phase 6; keep the initial migration to country/state/city only.

4. **Multilingual names:** OSM tags include `name:en`, `name:he`, `name:es`, etc. Should the cache store multiple languages and serve based on the user's `lang` cookie? Recommend: store `name` (default/English) and `name_local` (the local-language name) for now. Full i18n is a Phase 6 enhancement.

5. **Congregation location precision:** Currently congregations have `latitude`/`longitude` derived from the city. Should the migration preserve this, or should we add a "precise location" map-picker for congregation submitters? Recommend: preserve current behavior (city centroid) for the migration; add a precise-location picker in Phase 6.

6. **OSM data attribution:** The ODbL license requires attribution. Where to display it? Recommend: footer of every page, with link to OSM copyright page.

7. **Backup cadence for `osm_places`:** How often to back up the cache? It can always be rebuilt from OSM, but a backup speeds recovery. Recommend: weekly backup, matching the sync cadence.

8. **Monitoring:** What metrics to alert on? Recommend: `osm_places` row count (drop = sync failure), Nominatim request count (spike = abuse), cache hit rate (drop = cache invalidation bug), sync job duration (spike = Overpass degradation).

---

## 12. Final Recommendation

Proceed with the **hybrid-cache approach** (Phases 0–5). It preserves the existing user experience, defers self-hosting, and aligns with OSM's usage policies.

The estimated 3-week timeline is acceptable for a migration of this scope. The phased structure ensures the app is always in a working state, and each phase has a clean rollback.

**Before starting Phase 1, resolve the open questions in §11** — especially Q1 (geographic scope) and Q4 (multilingual names), as these affect the sync script's design.

**Concurrent with this migration, address the relevant findings from the code review** (especially S-5 filter injection — the new `osm_places` queries must use `pb.filter()`; and F-1 `getFullList` caching — Phase 3.2 implements this). The migration is a natural opportunity to fix these issues in the location-related code paths.

---

*End of migration plan.*
