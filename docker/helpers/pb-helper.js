import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_TEST_API ?? 'http://127.0.0.1:8090';

export const pb = new PocketBase(PB_URL);

export async function deleteTestUsers(prefix) {
  const list = await pb.collection('users').getFullList({ filter: pb.filter('email~{:email}', { email: prefix }) });
  await Promise.all(list.map((u) => pb.collection('users').delete(u.id)));
}

export async function findUserByEmail(email) {
  const list = await pb.collection('users').getFullList({ filter: pb.filter('email={:email}', { email }) });
  return list[0];
}
