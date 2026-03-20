<script>
	import { onDestroy, onMount } from 'svelte';
	import { circle, wgs84, icon } from '$lib/utils';
	import { differenceInSeconds } from 'date-fns';

	let mapElement;
	let map;
	let positionSource;

	export let data;

	onMount(async () => {
		const L = await import('leaflet');

		function announcementHue(announcement) {
			const d = differenceInSeconds(
				announcement.TimeAtLocationWithSeconds,
				announcement.AdvertisedTimeAtLocation
			);

			if (isNaN(d)) return 120;
			if (d <= 120) return 120;
			if (d >= 900) return 0;

			const t = (d - 120) / (900 - 120);
			return Math.round(120 * (1 - t));
		}

		const stationResult = await fetch('/stations');
		const stations = await stationResult.json();

		map = L.map(mapElement).setView([58, 15], 6);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
		L.tileLayer('https://c.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png').addTo(map);

		data.announcements.forEach((announcement) => {
			const { coordinates } = stations[announcement.LocationSignature];
			if (!coordinates) return;
			L.marker(coordinates, {
				icon: L.icon(circle(announcementHue(announcement)))
			}).addTo(map);
		});

		data.positions.forEach(addPosition);

		if (data.ssePosition) {
			positionSource = new EventSource(data.ssePosition);
			positionSource.onmessage = ({ data: s }) => {
				const json = JSON.parse(s);
				const [result] = json.RESPONSE.RESULT;
				result.TrainPosition.forEach(addPosition);
			};
		}

		function addPosition(position) {
			const marker = L.marker(wgs84(position.Position.WGS84), {
				icon: L.icon(icon(position.Bearing, 90))
			});
			marker.addTo(map); //.bindPopup(popupText(position, announcements));
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
