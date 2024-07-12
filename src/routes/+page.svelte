<script>
	import { onMount, onDestroy } from 'svelte';

	let mapElement;
	let map;
	let positionSource;
	let markers = {};

	export let data;

	onMount(async () => {
		const leaflet = await import('leaflet');

		map = leaflet.map(mapElement).setView([59.34389933923258, 17.053451499025947], 9);

		leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
		leaflet.tileLayer('https://c.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png').addTo(map);

		data.positions.forEach((position) => {
			const [lon, lat] = wgs84(position.Position.WGS84);
			const marker = leaflet.marker([lat, lon]);
			markers[position.Train.AdvertisedTrainNumber] = marker;
			marker.addTo(map).bindPopup(position.Train.AdvertisedTrainNumber);
		});

		if (data.ssePosition) {
			positionSource = new EventSource(data.ssePosition);
			positionSource.onmessage = ({ data: s }) => {
				const json = JSON.parse(s);
				const [result] = json.RESPONSE.RESULT;
				result.TrainPosition.forEach(addPosition);
			};
		}

		function addPosition(position) {
			const [lon, lat] = wgs84(position.Position.WGS84);
			markers[position.Train.AdvertisedTrainNumber]?.setLatLng([lat, lon]);
		}
	});

	onDestroy(async () => {
		if (map) {
			console.log('Unloading Leaflet map.');
			map.remove();
		}

		if (positionSource) positionSource.close();
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
