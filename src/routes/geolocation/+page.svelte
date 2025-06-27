<script>
	import { onDestroy, onMount } from 'svelte';
	import { code, groupAnnouncements, popupText, wgs84, icon } from '$lib/utils';

	let mapElement;
	let map;
	let positionSource;
	let markers = {};

	export let data;

	let announcements = groupAnnouncements(data.announcements);

	onMount(async () => {
		const L = await import('leaflet');

		function getColor(code) {
			let hue = -1;
			if (code === 'PNA014' || code === 'PNA040' || code === 'PNA041') hue = 240;
			if (code === 'PNA065') hue = 0;
			if (code === 'PNA038' || code === 'PNA098') hue = 60;
			if (code === 'PNA021') hue = 30;
			if (code === 'PNA023' || code === 'PNA025' || code === 'PNA026') hue = 120;
			if (code.startsWith('PNA054') || code === 'PNA010' || code === 'PNA043') hue = 180;
			return hue;
		}

		map = L.map(mapElement).setView([data.latitude ?? 58, data.longitude ?? 15], 11);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
		L.tileLayer('https://c.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png').addTo(map);

		data.positions.forEach((position) => {
			const marker = L.marker(wgs84(position.Position.WGS84), {
				icon: L.icon(icon(position.Bearing, getColor(code(position, announcements))))
			});
			markers[position.Train.AdvertisedTrainNumber] = marker;
			marker.addTo(map).bindPopup(popupText(position, announcements));
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
			const marker = markers[position.Train.AdvertisedTrainNumber];
			marker?.setLatLng(wgs84(position.Position.WGS84));
			marker?.setPopupContent(popupText(position, announcements));
			marker?.setIcon(L.icon(icon(position.Bearing, getColor(code(position, announcements)))));
		}
	});

	onDestroy(async () => {
		if (map) {
			console.log('Unloading Leaflet map.');
			map.remove();
		}

		if (positionSource) positionSource.close();
	});
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
