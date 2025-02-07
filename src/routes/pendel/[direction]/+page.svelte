<script>
	import { onDestroy, onMount } from 'svelte';
	import { groupAnnouncements, popupText, wgs84 } from '$lib';
	import { differenceInSeconds } from 'date-fns';

	let mapElement;
	let map;
	let positionSource, announcementSource;
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

		function icon(trainNumber) {
			const d = differenceInSeconds(
				announcements[trainNumber]?.TimeAtLocationWithSeconds,
				announcements[trainNumber]?.AdvertisedTimeAtLocation
			);

			let hue;
			if (isNaN(d)) hue = -1;
			else if (d < 120) hue = 120;
			else if (d < 180) hue = 75;
			else if (d < 300) hue = 60;
			else if (d < 600) hue = 33;
			else if (d < 900) hue = 25;
			else hue = 0;

			const black = `<polygon points="32,8 56,32 32,56 8,32" fill="none" stroke="black" stroke-width="12" />`;
			const diamond = `<polygon points="32,8 56,32 32,56 8,32" fill="none" stroke="hsl(${hue} ${hue === -1 ? '0%' : '100%'} 50%)" stroke-width="8" />`;
			const b = `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">${black}${diamond}</svg>`;
			return L.icon({
				...iconSize,
				iconUrl: `data:image/svg+xml;base64,${btoa(b)}`
			});
		}

		map = L.map(mapElement).setView([59.33, 18.07], 11);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
		L.tileLayer('https://c.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png').addTo(map);

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

		if (data.sseAnnouncement) {
			announcementSource = new EventSource(data.sseAnnouncement);
			announcementSource.onmessage = ({ data: s }) => {
				const json = JSON.parse(s);
				const [result] = json.RESPONSE.RESULT;
				result.TrainAnnouncement.forEach((a) => {
					const trainNumber = a.AdvertisedTrainIdent;
					announcements[trainNumber] = a;
					const marker = markers[trainNumber];
					marker?.setIcon(icon(trainNumber));
				});
			};
		}

		function addPosition(position) {
			const trainNumber = position.Train.AdvertisedTrainNumber;
			const marker = markers[trainNumber];
			marker?.setLatLng(wgs84(position.Position.WGS84));
			marker?.setPopupContent(popupText(position, announcements));
			marker?.setIcon(icon(trainNumber));
		}
	});

	onDestroy(async () => {
		if (map) {
			console.log('Unloading Leaflet map.');
			map.remove();
		}

		if (positionSource) positionSource.close();
		if (announcementSource) announcementSource.close();
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
