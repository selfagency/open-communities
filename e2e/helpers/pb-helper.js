/**
 * PocketBase API helpers for E2E tests.
 * Authenticates as superuser and provides record cleanup utilities.
 */

const PB_API = process.env.PB_API ?? 'http://127.0.0.1:8090/api';
const PB_ADMIN = process.env.PB_TEST_ADMIN;
const PB_PASSWORD = process.env.PB_TEST_PASSWORD;

let _token = null;
let _tokenExpiry = 0;

async function getToken() {
  if (_token && Date.now() < _tokenExpiry) return _token;
  if (!PB_ADMIN || !PB_PASSWORD) {
    throw new Error('PB_TEST_ADMIN and PB_TEST_PASSWORD env vars required');
  }
  // PB v0.22+ moved superuser auth to /api/collections/_superusers/auth-with-password
  // Fall back to the legacy /api/admins/auth-with-password for older versions.
  const endpoints = [
    `${PB_API}/collections/_superusers/auth-with-password`,
    `${PB_API}/admins/auth-with-password`
  ];
  for (const url of endpoints) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identity: PB_ADMIN, password: PB_PASSWORD }),
    });
    if (res.ok) {
      const data = await res.json();
      _token = data.token;
      _tokenExpiry = Date.now() + 3_600_000; // 1 hour
      return _token;
    }
  }
  throw new Error(`PB auth failed — tried ${endpoints.length} endpoints`);
}

/**
 * Delete users whose email starts with the given prefix.
 * Used to clean up test-created accounts after E2E runs.
 */
export async function deleteTestUsers(emailPrefix) {
  const token = await getToken();
  const filter = encodeURIComponent(`email ~ '${emailPrefix}%'`);
  const listRes = await fetch(
    `${PB_API}/collections/users/records?filter=${filter}&perPage=100`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!listRes.ok) return;
  const list = await listRes.json();

  for (const user of list.items ?? []) {
    await fetch(`${PB_API}/collections/users/records/${user.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }
}
