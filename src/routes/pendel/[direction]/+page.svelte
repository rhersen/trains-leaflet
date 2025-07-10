<script>
	import { onDestroy, onMount } from 'svelte';
	import { groupAnnouncements, popupText, wgs84 } from '$lib/utils';
	import { differenceInSeconds } from 'date-fns';

	let mapElement;
	let map;
	let positionSource, announcementSource;
	const markers = {};

	export let data;

	const announcements = groupAnnouncements(data.announcements);

	onMount(async () => {
		const L = await import('leaflet');

		const iconSize = {
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

		function createSquareIcon(hue) {
			const black = `<polygon points="32,8 56,32 32,56 8,32" fill="none" stroke="black" stroke-width="12" />`;
			const diamond = `<polygon points="32,8 56,32 32,56 8,32" fill="none" stroke="hsl(${hue} ${hue === -1 ? '0%' : '100%'} 50%)" stroke-width="8" />`;
			const b = `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">${black}${diamond}</svg>`;
			return L.icon({
				...iconSize,
				iconUrl: `data:image/svg+xml;base64,${btoa(b)}`
			});
		}

		const circle0 = createCircleIcon(120);
		const circle1 = createCircleIcon(75);
		const circle3 = createCircleIcon(60);
		const circle5 = createCircleIcon(33);
		const circle10 = createCircleIcon(25);
		const circle15 = createCircleIcon(0);

		const squareNaN = createSquareIcon(-1);
		const square0 = createSquareIcon(120);
		const square1 = createSquareIcon(75);
		const square3 = createSquareIcon(60);
		const square5 = createSquareIcon(33);
		const square10 = createSquareIcon(25);
		const square15 = createSquareIcon(0);

		function icon(trainNumber) {
			const d = differenceInSeconds(
				announcements[trainNumber]?.TimeAtLocationWithSeconds,
				announcements[trainNumber]?.AdvertisedTimeAtLocation
			);
			const atStation = announcements[trainNumber]?.ActivityType === 'Ankomst';
			if (isNaN(d)) return squareNaN;
			if (d < 120) return atStation ? square0 : circle0;
			if (d < 180) return atStation ? square1 : circle1;
			if (d < 300) return atStation ? square3 : circle3;
			if (d < 600) return atStation ? square5 : circle5;
			if (d < 900) return atStation ? square10 : circle10;
			return atStation ? square15 : circle15;
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
