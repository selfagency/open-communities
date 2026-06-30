# Open Communities

[![CI](https://github.com/selfagency/open-communities/actions/workflows/ci.yml/badge.svg)](https://github.com/selfagency/open-communities/actions/workflows/ci.yml) [![Deploy](https://github.com/selfagency/open-communities/actions/workflows/deploy.yml/badge.svg)](https://github.com/selfagency/open-communities/actions/workflows/deploy.yml) [![Codacy Badge](https://app.codacy.com/project/badge/Grade/5808338dfe5b4cffbc7f92505f5fbcf8)](https://app.codacy.com/gh/selfagency/open-communities/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade) [![codecov](https://codecov.io/gh/selfagency/open-communities/graph/badge.svg?token=ZZK4C3X39P)](https://codecov.io/gh/selfagency/open-communities)

Open Communities is a Sveltekit application that allows users to search for Jewish congregations that are welcoming of Jews opposed to Israel's war in Gaza. The app could feasibly be adapted to any kind of directory, but not without some considerable work.

## Installation

Install [PNPM](https://pnpm.io/) somewhere in your path. Then:

```bash
git clone https://github.com/selfagency/open-communities.git
cd open-communities
pnpm i
pnpm run deps:up
```

Log into PocketBase, create an admin account, then import `pb_schema.json`. You can also create a user account and grant it 'admin' privileges. Admins can only be enabled through the backend, not through the frontend app. You'll also need to import a dump of the location data, which is a little large to contain in the repo, so be in touch. I may switch to using an external API in the near future. Then log into [Cap](https://github.com/tiagorangel1/cap) and create an admin user, an API key, and new site key.

Create an `.env.dynamic` file (see `.env.example` for all available variables):

```bash
ADMIN_EMAIL="admin@example.test"
CAP_API_KEY=""
CAPTCHA_SITE_SECRET=""
NODE_ENV="development"
PUBLIC_API_ENDPOINT="http://localhost:8090"
PUBLIC_CAPTCHA_ENDPOINT="http://localhost:3001"
PUBLIC_CAPTCHA_SITE_KEY=""
PUBLIC_HOSTNAME="http://localhost:5173"
PUBLIC_POSTHOG_KEY=""
PUBLIC_POSTHOG_HOST=""
SMTP_HOST="localhost"
SMTP_PORT="1025"
LT_API_URL=""
LT_API_KEY=""
CAPTCHA_INTERNAL_ENDPOINT=""
```

And finally an `.env.test` file (overrides `.env.dynamic` values for testing):

```bash
ADMIN_EMAIL="admin@test.com"
CAP_API_KEY=""
NODE_ENV="test"
PB_TEST_ADMIN="admin@test.com"
PB_TEST_PASSWORD="i3_NL-dfzzFt5TX"
PUBLIC_API_ENDPOINT="http://localhost:8090"
PUBLIC_CAPTCHA_ENDPOINT="http://localhost:3001"
PUBLIC_CAPTCHA_SITE_KEY=""
PUBLIC_HOSTNAME="http://localhost:4173"
PUBLIC_POSTHOG_KEY=""
PUBLIC_POSTHOG_HOST=""
SMTP_HOST="localhost"
SMTP_PORT="1025"
```

## Development

```bash
pnpm run deps:up & pnpm run dev

# after dev
pnpm run deps:down
```

## Production

Deploy with [Coolify](https://coolify.io/) or any Docker host. CI builds a Docker image and pushes to GHCR automatically using the [`docker/Dockerfile`](docker/Dockerfile). For local development and testing, use the unified [`docker/docker-compose.yml`](docker/docker-compose.yml).

## Credits

Made with:

- [Sveltekit](https://kit.svelte.dev/)
- [Tailwind CSS](https://tailwindcss.com)
- [Stately](https://github.com/selfagency/stately)
- [shadcn-svelte](https://shadcn-svelte.com) and [Bits UI](https://bits-ui.com)
- [svelte-maplibre](https://github.com/dimfeld/svelte-maplibre) and [MapLibre](https://github.com/maplibre/maplibre-gl-js)
- [Superforms](https://superforms.rocks/) and [Formsnap](https://formsnap.dev/)
- [Radashi](https://radashi.js.org/)

Fonts provided by [Nathatype](https://nathatype.com/) and [Mozilla](https://github.com/mozilla/mozilla-text-type).

Icons by [Tabler Icons](https://tabler.io/icons) and [The Noun Project](https://thenounproject.com/) (Ferifrey, Agarunov Oktay-Abraham, filosovis, and Arthur Shlain)

Illustrations by [Icons8](https://icons8.com/illustrations/style--journal)

Map data provided by [OpenStreetMaps](openstreetmap.org)
