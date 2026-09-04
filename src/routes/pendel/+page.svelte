<script>
	import { onDestroy, onMount } from 'svelte';
	import { groupAnnouncements, popupText, wgs84 } from '$lib/utils';
	import { differenceInSeconds } from 'date-fns';

	let mapElement;
	let map;
	let positionSource, announcementSource;
	const markers = {};
	const previousPositions = {};
	const tails = {};

	export let data;

	const announcements = groupAnnouncements(data.announcements?.TrainAnnouncement ?? []);

	function circleIcon(L, position) {
		return L.divIcon({
			className: '',
			html: `<div style="width: 16px; height: 16px; box-sizing: border-box; border: 2px solid white; border-radius: 50%; background: #c026d3; box-shadow: 0 1px 4px rgb(0 0 0 / 45%);"></div>`,
			iconSize: [16, 16],
			iconAnchor: [8, 8]
		});
	}

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

		map = L.map(mapElement).setView([59.33, 18.07], 9);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
		L.tileLayer('https://c.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png').addTo(map);

		data.positions.TrainPosition.forEach((position) => {
			const marker = L.marker(wgs84(position.Position.WGS84), {
				icon: circleIcon(L, position)
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
			const currentPosition = wgs84(position.Position.WGS84);
			const positions = previousPositions[trainNumber] ?? [];
			const marker = markers[trainNumber];
			const timestamp = new Date(position.TimeStamp).getTime();

			positions.push({ coordinate: currentPosition, timestamp });
			previousPositions[trainNumber] = positions.filter(
				({ timestamp: positionTimestamp }) => timestamp - positionTimestamp <= 60_000
			);

			const tailCoordinates = previousPositions[trainNumber].map(({ coordinate }) => coordinate);
			if (tailCoordinates.length > 1) {
				const color = '#c026d3';
				if (tails[trainNumber]) {
					tails[trainNumber].outline.setLatLngs(tailCoordinates);
					tails[trainNumber].line.setLatLngs(tailCoordinates);
					tails[trainNumber].line.setStyle({ color });
				} else {
					tails[trainNumber] = {
						outline: L.polyline(tailCoordinates, {
							color: 'white',
							weight: 10
						}).addTo(map),
						line: L.polyline(tailCoordinates, {
							color,
							weight: 6
						}).addTo(map)
					};
				}
			}

			if (marker) {
				marker.setLatLng(currentPosition);
				marker.setPopupContent(popupText(position, announcements));
				marker.setIcon(circleIcon(L, position));
			} else {
				markers[trainNumber] = L.marker(currentPosition, {
					icon: circleIcon(L, position)
				});
				markers[trainNumber].addTo(map).bindPopup(popupText(position, announcements));
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
