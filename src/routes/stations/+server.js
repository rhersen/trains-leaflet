import { json } from '@sveltejs/kit';
import stationsBySignature from '$lib/server/stationsBySignature';

let stations = null;

export const GET = async () => {
	try {
		if (!stations) stations = await stationsBySignature();
		else console.log('Using cached stations');
		return json(stations);
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error';
		return json({ error: message }, { status: 502 });
	}
};
