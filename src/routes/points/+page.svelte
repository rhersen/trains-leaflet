<script>
	import { onDestroy, onMount } from 'svelte';
	import { groupAnnouncements, popupText, wgs84 } from '$lib';

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
		const icon = L.icon({ ...iconSize, iconUrl: 'circle-blue.svg' });

		map = L.map(mapElement).setView([59.3, 18], 12);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
		L.tileLayer('https://c.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png').addTo(map);

		data.positions.forEach((position) => {
			const marker = L.marker(wgs84(position.Position.WGS84), {
				icon
			});
			markers[position.Position.SWEREF99TM] = marker;
			marker.addTo(map).bindPopup(popupText(position, announcements));
		});

		if (data.ssePosition) {
			positionSource = new EventSource(data.ssePosition);
			positionSource.onmessage = ({ data: s }) => {
				console.log(s);
				const json = JSON.parse(s);
				console.log(json);
				const [result] = json.RESPONSE.RESULT;
				result.TrainPosition.forEach(addPosition);
			};
		}

		function addPosition(position) {
			console.log(position.Position.SWEREF99TM);
			const marker = markers[position.Position.SWEREF99TM];
			if (marker) {
				marker.setLatLng(wgs84(position.Position.WGS84));
				marker.setPopupContent(
					marker.getPopup().getContent() + ',' + popupText(position, announcements)
				);
			} else {
				const marker = L.marker(wgs84(position.Position.WGS84), {
					icon
				});
				markers[position.Position.SWEREF99TM] = marker;
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
