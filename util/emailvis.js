import Pocketbase from 'pocketbase';

const pb = new Pocketbase(process.env.PB_ENDPOINT);

(async () => {
	try {
		await pb.admins.authWithPassword(process.env.PB_EMAIL, process.env.PB_PASSWORD);
		const users = await pb.collection('users').getFullList();
		await Promise.all(
			users.map(async (u) => await pb.collection('users').update(u.id, { emailVisibility: true }))
		);
	} catch (error) {
		console.log(error);
	}
})();
