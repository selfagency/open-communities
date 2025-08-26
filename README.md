# Open Communities

[![Build](https://github.com/selfagency/open-communities/actions/workflows/build.yml/badge.svg)](https://github.com/selfagency/open-communities/actions/workflows/build.yml) [![CI](https://github.com/selfagency/open-communities/actions/workflows/ci.yml/badge.svg)](https://github.com/selfagency/open-communities/actions/workflows/ci.yml) [![E2E](https://github.com/selfagency/open-communities/actions/workflows/e2e.yml/badge.svg)](https://github.com/selfagency/open-communities/actions/workflows/e2e.yml)

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

Setup a [Sentry](https://sentry.io/) project. Then create a `.env` file containing:

```bash
PUBLIC_SENTRY_DSN=""
SENTRY_AUTH_TOKEN=""
```

We also need a `.env.dynamic` file containing:

```bash
ADMIN_EMAIL=""
CAPTCHA_SITE_SECRET=""
NODE_ENV="development"
PUBLIC_API_ENDPOINT="http://localhost:8090"
PUBLIC_CAPTCHA_ENDPOINT="http://localhost:3001"
PUBLIC_HOSTNAME="http://localhost:5173"
SMTP_HOST="localhost"
SMTP_PORT="1025"
```

And finally an `.env.test` file containing those same variables, but for testing.

```bash
ADMIN_EMAIL=""
CAP_API_KEY=""
NODE_ENV="test"
PB_TEST_ADMIN="admin@test.com"
PB_TEST_PASSWORD="i3_NL-dfzzFt5TX"
PUBLIC_API_ENDPOINT="http://localhost:8090"
PUBLIC_CAPTCHA_ENDPOINT="http://localhost:3001"
PUBLIC_HOSTNAME="http://localhost:4173"
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

This project is intended to be deployed to Vercel with an existent PocketBase backend. Just link the repo from your own GitHub or GitLab to your Vercel project and it will deploy automatically with each push to the `main` branch.

## Credits

Made with:

- [Sveltekit](https://kit.svelte.dev/)
- [Tailwind CSS](https://tailwindcss.com)
- [nanostores](https://github.com/nanostores/nanostores)
- [shadcdn-svelte](https://www.shadcn-svelte.com) and [Bits UI](https://bits-ui.com)
- [svelte-maplibre](https://github.com/dimfeld/svelte-maplibre) and [MapLibre](https://github.com/maplibre/maplibre-gl-js)
- [Superforms](https://superforms.rocks/) and [Formsnap](https://formsnap.dev/)
- [Radashi](https://radashi.js.org/)

Fonts provided by [The Braille Institute](https://www.brailleinstitute.org/freefont/) and [Prioritype Co.](https://www.behance.net/gallery/119990601/Magilio-A-Chic-Serif-Fonts)

Icons by [Lucide](https://lucide.dev/) and [The Noun Project](https://thenounproject.com/) (Ferifrey, Agarunov Oktay-Abraham, filosovis, and Arthur Shlain)

Illustrations by [Icons8](https://icons8.com/illustrations/style--journal)

Map data provided by [OpenStreetMaps](openstreetmap.org)
