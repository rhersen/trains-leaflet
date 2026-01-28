export function load({ url, data }) {
	return {
		trains: url.searchParams.getAll('train'),
		announcements: data.announcements
	};
}
