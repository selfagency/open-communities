# Open Communities

Open Communities is a Sveltekit application that allows users to search for Jewish congregations that are welcoming of Jews opposed to Israel's war in Gaza. The app could feasibly be adapted to any kind of directory, but not without some considerable work.

## Installation

Install [PocketBase](https://pocketbase.io/docs/) and [PNPM](https://pnpm.io/) somewhere in your path. Then:

```bash
git clone https://github.com/selfagency/open-communities.git
cd open-communities
pnpm i
pb serve
```

Log into PocketBase, create an admin account, then import `pb_schema.json`. You can also create a user account and grant it 'admin' privileges. Admins can only be enabled through the backend, not through the frontend app. You'll also need to import a dump of the location data, which is a little large to contain in the repo, so be in touch. I may switch to using an external API in the near future.

Setup a [Sentry](https://sentry.io/) project and get site credentials from [Prosopo](https://prosopo.io/) for captcha. Then create a `.env` file containing:

```bash
PUBLIC_HOSTNAME="http://localhost:5173"
PUBLIC_API_ENDPOINT="http://127.0.0.1:8090"
PUBLIC_SENTRY_DSN=""
SENTRY_AUTH_TOKEN=""
SENTRY_PROJECT=""
SENTRY_ORG=""
PUBLIC_PROSOPO_SITEKEY=""
PROSOPO_ENDPOINT=""
PROSOPO_SECRET=""
VERCEL_ENV="development"
VERCEL_GIT_COMMIT_SHA="dev"
```

## Development

```bash
pb serve
pnpm run dev
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
