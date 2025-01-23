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
		const blueIcon = L.icon({ ...iconSize, iconUrl: '/circle-blue.svg' });
		const redIcon = L.icon({ ...iconSize, iconUrl: '/circle-red.svg' });
		const greenIcon = L.icon({ ...iconSize, iconUrl: '/circle-green.svg' });
		const cyanIcon = L.icon({ ...iconSize, iconUrl: '/circle-cyan.svg' });

		function icon(trainNumber) {
			const d = differenceInSeconds(
				announcements[trainNumber]?.TimeAtLocationWithSeconds,
				announcements[trainNumber]?.AdvertisedTimeAtLocation
			);
			console.log(trainNumber, d);
			if (d < 100) return greenIcon;
			if (d < 200) return blueIcon;
			if (d < 400) return cyanIcon;
			return redIcon;
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
