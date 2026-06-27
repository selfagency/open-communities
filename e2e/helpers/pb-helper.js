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
  const res = await fetch(`${PB_API}/admins/auth-with-password`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ identity: PB_ADMIN, password: PB_PASSWORD }),
  });
  if (!res.ok) throw new Error(`PB auth failed: ${res.status}`);
  const data = await res.json();
  _token = data.token;
  _tokenExpiry = Date.now() + 3_600_000; // 1 hour
  return _token;
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
