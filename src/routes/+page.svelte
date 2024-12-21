<script>
	import { onDestroy, onMount } from 'svelte';
	import { code, groupAnnouncements, popupText, wgs84 } from '$lib';

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
		const blueIcon = L.icon({ ...iconSize, iconUrl: 'circle-blue.svg' });
		const redIcon = L.icon({ ...iconSize, iconUrl: 'circle-red.svg' });
		const greenIcon = L.icon({ ...iconSize, iconUrl: 'circle-green.svg' });
		const cyanIcon = L.icon({ ...iconSize, iconUrl: 'circle-cyan.svg' });

		function icon(code) {
			if (code === 'PNA014') return blueIcon;
			if (code === 'PNA068') return redIcon;
			if (code === 'PNA023' || code === 'PNA025' || code === 'PNA026') return greenIcon;
			if (code.startsWith('PNA054')) return cyanIcon;
			return blueIcon;
		}

		map = L.map(mapElement).setView([59.34389933923258, 14], 7);

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
			marker?.setLatLng(wgs84(position.Position.WGS84));
			marker?.setPopupContent(popupText(position, announcements));
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
