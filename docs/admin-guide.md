# Open Communities Admin Guide

Admins can manage congregations, users, CMS pages, translations, and dashboard stats from the `/admin` area.

## Admin dashboard

Open `/admin` to see the main counts:

- total congregations
- total users
- pending congregation approvals

The stats endpoint also exposes:

- top countries
- top states
- top cities
- total cities
- total states
- total countries

## Congregations

Open `/admin/congregations` to review all congregations.

The page groups listings into:

- active congregations
- pending congregations

Admin actions include:

- reviewing new or pending listings
- making a listing visible or hidden
- deleting a congregation when it should be removed

## Users

Open `/admin/users` to search and manage user accounts.

You can:

- search by name or email
- page through the user list
- open a user detail page

On a user detail page, admins can:

- update name and email
- mark a user verified or unverified
- grant or remove admin access
- assign a congregation to the user
- unlink the user from a congregation
- delete the user account
- send a password reset email

Safety rules:

- the last admin cannot be demoted
- admins cannot demote themselves

## Pages

Open `/admin/pages` to manage site pages.

You can:

- view the page list
- create a new page at `/admin/pages/new`
- edit an existing page at `/admin/pages/[id]`

Page editing supports:

- title, slug, and description updates
- image upload
- localized page variants

## Translations

Open `/admin/translations` to manage translation keys and locale values.

You can:

- search translation keys
- add a new translation key
- save locale values for a key
- delete a translation key and its values
- auto-translate text into selected locales
- check translation job status
- trigger a redeploy after translation changes

Notes:

- translation automation depends on LibreTranslate configuration
- deploy actions depend on the GitHub deploy token

## Suggested workflow

1. Review dashboard stats.
2. Triage pending congregations.
3. Fix or delete bad user records.
4. Update pages and translations.
5. Redeploy when translation content changes.
