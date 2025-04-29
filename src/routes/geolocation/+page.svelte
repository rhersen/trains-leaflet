<script>
	import { onDestroy, onMount } from 'svelte';
	import { code, groupAnnouncements, popupText, wgs84 } from '$lib/utils';

	let mapElement;
	let map;
	let positionSource;
	let markers = {};

	export let data;

	let announcements = groupAnnouncements(data.announcements);

	onMount(async () => {
		const L = await import('leaflet');

		let iconSize = {
			iconSize: [32, 32],
			iconAnchor: [16, 16],
			popupAnchor: [0, -16]
		};

		function icon(code) {
			let color = 'grey';
			if (code === 'PNA014') color = 'blue';
			if (code === 'PNA065') color = 'red';
			if (code === 'PNA038' || code === 'PNA098') color = 'yellow';
			if (code === 'PNA023' || code === 'PNA025' || code === 'PNA026') color = 'green';
			if (code.startsWith('PNA054')) color = 'cyan';
			const circle = `<circle cx="32" cy="32" r="25" fill="none" stroke="${color}" stroke-width="12" />`;
			const svg = `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">${circle}</svg>`;
			return L.icon({
				...iconSize,
				iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`
			});
		}

		map = L.map(mapElement).setView([data.latitude ?? 58, data.longitude ?? 15], 11);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
		L.tileLayer('https://c.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png').addTo(map);

		data.positions.forEach((position) => {
			const marker = L.marker(wgs84(position.Position.WGS84), {
				icon: icon(code(position, announcements))
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
			if (marker) {
				marker?.setLatLng(wgs84(position.Position.WGS84));
				marker?.setPopupContent(popupText(position, announcements));
			} else {
				const marker = L.marker(wgs84(position.Position.WGS84), {
					icon: icon(code(position, announcements))
				});
				markers[position.Train.AdvertisedTrainNumber] = marker;
				marker.addTo(map).bindPopup(popupText(position, announcements));
			}
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
