<script>
	import { onDestroy, onMount } from 'svelte';
	import { groupAnnouncements, popupText, wgs84, icon } from '$lib/utils';
	import { differenceInSeconds } from 'date-fns';

	let mapElement;
	let map;
	let positionSource;
	const markers = {};

	export let data;

	const announcements = groupAnnouncements(data.announcements);

	onMount(async () => {
		const L = await import('leaflet');

		function getHue(position) {
			const d = differenceInSeconds(
				announcements[position.Train.AdvertisedTrainNumber]?.TimeAtLocationWithSeconds,
				announcements[position.Train.AdvertisedTrainNumber]?.AdvertisedTimeAtLocation
			);

			let hue;
			if (isNaN(d)) hue = 120;
			else if (d < 120) hue = 120;
			else if (d < 180) hue = 75;
			else if (d < 300) hue = 60;
			else if (d < 600) hue = 33;
			else if (d < 900) hue = 25;
			else hue = 0;

			return hue;
		}

		map = L.map(mapElement).setView([58, 15], 6);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
		L.tileLayer('https://c.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png').addTo(map);

		data.positions.forEach((position) => {
			const marker = L.marker(wgs84(position.Position.WGS84), {
				icon: L.icon(icon(position.Bearing, getHue(position)))
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
			marker?.setIcon(L.icon(icon(position.Bearing, getHue(position))));
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
