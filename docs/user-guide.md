# Open Communities User Guide

## Account creation

1. Open `/login`.
2. Choose **Sign up**.
3. Enter your name, email, language, password, and password confirmation.
4. Complete the captcha.
5. Submit the form.

After signup, the app sends a verification email. Use that email to verify your account before continuing.

## Account management

Open `/account` to manage your profile.

You can:

- update your name, email visibility, language, and notification preference
- change your password by entering your current password, new password, and confirmation
- unlink your account from a congregation
- delete your account

### Password changes

Password changes require your current password. If the new password and confirmation do not match, the update fails.

### Delete account

Account deletion is permanent. It removes your user record, clears your session, and returns you to the home page.

## Add a congregation

1. Open `/add`.
2. Fill in the congregation details.
3. Choose the location and description fields.
4. Complete the captcha.
5. Submit the form.

Notes:

- Non-admin submissions are saved as unapproved until an admin reviews them.
- If you are signed in as a regular user, the site links your account to the new congregation automatically.

## Manage a congregation

If your account is linked to a congregation, `/account` shows a link to edit it.

You can also open `/edit?id=<congregation-id>` directly.

From the edit page, you can:

- update congregation details
- edit child sections such as accessibility, fit, services, health, security, and registration
- change whether the listing is visible, if you are an admin

Regular users may edit only their own congregation. Admins may edit any congregation.

## Request transfer of a congregation

To request ownership transfer, use the **Contact** page.

1. Open `/contact`.
2. Choose the transfer-related reason.
3. Include the congregation record ID and the recipient email.
4. Submit the form.

The app sends a transfer request email and will fail if the target user does not exist.

## Delete a congregation

Open the congregation in `/edit?id=<congregation-id>` and use the delete action.

What happens:

- the congregation record is deleted
- related child records are removed
- your account is unlinked from the congregation
- non-admin users receive a confirmation email

Admins can also approve or reject congregations from the admin tools, including direct delete for rejected listings.

## Claim an unowned congregation

If a listing has no owner, it shows a **Claim this** link on the congregation page.

That link opens `/contact?claim=<congregation-id>` so you can request ownership.
