export function load({ url }) {
	const train = url.searchParams.get('train');
	return { train };
}
