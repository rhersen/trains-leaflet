<script>
	import { onDestroy, onMount } from 'svelte';
	import { groupAnnouncements, popupText, wgs84 } from '$lib';
	import { differenceInSeconds } from 'date-fns';

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

		function createCircleIcon(hue) {
			const black = `<circle cx="32" cy="32" r="25" fill="none" stroke="black" stroke-width="12" />`;
			const circle = `<circle cx="32" cy="32" r="25" fill="none" stroke="hsl(${hue} 100% 50%" stroke-width="8" />`;
			const b = `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">${black}${circle}</svg>`;
			return L.icon({
				...iconSize,
				iconUrl: `data:image/svg+xml;base64,${btoa(b)}`
			});
		}

		const delay0 = createCircleIcon(120);
		const delay1 = createCircleIcon(75);
		const delay3 = createCircleIcon(60);
		const delay5 = createCircleIcon(33);
		const delay10 = createCircleIcon(25);
		const delay15 = createCircleIcon(0);

		function icon(trainNumber) {
			const d = differenceInSeconds(
				announcements[trainNumber]?.TimeAtLocationWithSeconds,
				announcements[trainNumber]?.AdvertisedTimeAtLocation
			);
			if (d < 120) return delay0;
			if (d < 180) return delay1;
			if (d < 300) return delay3;
			if (d < 600) return delay5;
			if (d < 900) return delay10;
			return delay15;
		}

		map = L.map(mapElement).setView([59.33, 18.07], 11);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
		L.tileLayer('https://c.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png').addTo(map);
		console.log(announcements);
		Object.entries(announcements).forEach(([key, value]) => {
			console.log(
				key,
				differenceInSeconds(value.TimeAtLocationWithSeconds, value.AdvertisedTimeAtLocation)
			);
		});
		data.positions.forEach((position) => {
			const marker = L.marker(wgs84(position.Position.WGS84), {
				icon: icon(position.Train.AdvertisedTrainNumber)
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
			const trainNumber = position.Train.AdvertisedTrainNumber;
			const marker = markers[trainNumber];
			marker?.setLatLng(wgs84(position.Position.WGS84));
			marker?.setPopupContent(popupText(position, announcements));
			marker?.setIcon(icon(trainNumber));

			console.log(
				trainNumber,
				announcements[trainNumber]?.TimeAtLocationWithSeconds,
				announcements[trainNumber]?.AdvertisedTimeAtLocation
			);
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
