<script>
	import { onDestroy, onMount } from 'svelte';
	import { groupAnnouncements, popupText, wgs84, icon } from '$lib/utils';
	import { differenceInSeconds } from 'date-fns';

	let mapElement;
	let map;
	let positionSource, announcementSource;
	const markers = {};

	export let data;

	const announcements = groupAnnouncements(data.announcements?.TrainAnnouncement ?? []);

	function getHue(position) {
		const d = differenceInSeconds(
			announcements[position.Train.AdvertisedTrainNumber]?.TimeAtLocationWithSeconds,
			announcements[position.Train.AdvertisedTrainNumber]?.AdvertisedTimeAtLocation
		);

		if (isNaN(d)) return -1;
		else if (d < 120) return 120;
		else if (d < 180) return 75;
		else if (d < 300) return 60;
		else if (d < 600) return 33;
		else if (d < 900) return 25;
		else return 0;
	}

	onMount(async () => {
		const L = await import('leaflet');

		map = L.map(mapElement).setView([59.33, 18.07], 11);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
		L.tileLayer('https://c.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png').addTo(map);

		data.positions.TrainPosition.forEach((position) => {
			const marker = L.marker(wgs84(position.Position.WGS84), {
				icon: L.icon(icon(position.Bearing, getHue(position)))
			});
			markers[position.Train.AdvertisedTrainNumber] = marker;
			marker.addTo(map).bindPopup(popupText(position, announcements));
		});

		if (data.positions.INFO?.SSEURL) {
			positionSource = new EventSource(data.positions.INFO.SSEURL);
			positionSource.onmessage = ({ data: s }) => {
				const json = JSON.parse(s);
				const [result] = json.RESPONSE.RESULT;
				result.TrainPosition.forEach(addPosition);
			};
		}

		if (data.announcements.INFO?.SSEURL) {
			announcementSource = new EventSource(data.announcements.INFO.SSEURL);
			announcementSource.onmessage = ({ data: s }) => {
				const json = JSON.parse(s);
				const [result] = json.RESPONSE.RESULT;
				result.TrainAnnouncement.forEach((a) => {
					const trainNumber = a.AdvertisedTrainIdent;
					announcements[trainNumber] = a;
				});
			};
		}

		function addPosition(position) {
			const trainNumber = position.Train.AdvertisedTrainNumber;
			if (!markers[trainNumber]) {
				console.log('creating marker for', trainNumber);
				markers[trainNumber] = L.marker(wgs84(position.Position.WGS84), {
					icon: L.icon(icon(position.Bearing, getHue(position)))
				});
				markers[trainNumber].addTo(map).bindPopup(popupText(position, announcements));
			} else {
				const marker = markers[trainNumber];
				marker?.setLatLng(wgs84(position.Position.WGS84));
				marker?.setPopupContent(popupText(position, announcements));
				marker?.setIcon(L.icon(icon(position.Bearing, getHue(position))));
			}
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
