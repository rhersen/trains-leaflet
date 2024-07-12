<script>
	import { onMount, onDestroy } from 'svelte';

	let mapElement;
	let map;

	export let data;

	onMount(async () => {
		const leaflet = await import('leaflet');

		map = leaflet.map(mapElement).setView([59.34389933923258, 17.053451499025947], 9);

		leaflet
			.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution:
					'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
			})
			.addTo(map);

		data.positions.forEach((position) => {
			const [lat, lon] = wgs84(position.Position.WGS84);
			leaflet.marker([lon, lat]).addTo(map).bindPopup(position.Train.AdvertisedTrainNumber);
		});
	});

	onDestroy(async () => {
		if (map) {
			console.log('Unloading Leaflet map.');
			map.remove();
		}
	});

	function wgs84(s) {
		return s
			.match(/POINT \(([^ ]+) ([^ ]+)\)/)
			.slice(1)
			.map(Number);
	}
</script>

<main>
	<div bind:this={mapElement}></div>
</main>

<style>
	@import 'leaflet/dist/leaflet.css';
	main div {
		height: 800px;
	}
</style>
