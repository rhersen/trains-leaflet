<script>
	import { onMount, onDestroy } from 'svelte';
	import groupBy from '$lib/groupBy.js';

	let mapElement;
	let map;
	let positionSource;
	let markers = {};

	export let data;

	let announcements = Object.fromEntries(
		Object.entries(groupBy(data.announcements, (a) => a.AdvertisedTrainIdent)).map(
			([train, [announcement]]) => [train, announcement]
		)
	);

	onMount(async () => {
		const L = await import('leaflet');

		let iconSize = {
			iconSize: [32, 32],
			iconAnchor: [16, 16],
			popupAnchor: [0, -16]
		};
		const blueIcon = L.icon({ ...iconSize, iconUrl: 'circle-blue.svg' });
		const greyIcon = L.icon({ ...iconSize, iconUrl: 'circle-grey.svg' });

		map = L.map(mapElement).setView([59.34389933923258, 17.053451499025947], 9);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
		L.tileLayer('https://c.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png').addTo(map);

		data.positions.forEach((position) => {
			const [lon, lat] = wgs84(position.Position.WGS84);
			const announcement = announcements[position.Train.AdvertisedTrainNumber];
			const code = announcement ? announcement.ProductInformation.map((p) => p.Code).join(' ') : '';
			const marker = L.marker([lat, lon], { icon: code === 'PNA014' ? blueIcon : greyIcon });
			markers[position.Train.AdvertisedTrainNumber] = marker;
			marker.addTo(map).bindPopup(popupText(position));
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
			const [lon, lat] = wgs84(position.Position.WGS84);
			const marker = markers[position.Train.AdvertisedTrainNumber];
			marker?.setLatLng([lat, lon]);
			marker?.setPopupContent(popupText(position));
		}
	});

	onDestroy(async () => {
		if (map) {
			console.log('Unloading Leaflet map.');
			map.remove();
		}

		if (positionSource) positionSource.close();
	});

	function popupText(position) {
		const announcement = announcements[position.Train.AdvertisedTrainNumber];
		const product = announcement
			? announcement.ProductInformation.map((p) => p.Description).join(' ') + ' '
			: '';
		const to = announcement
			? '<br>mot ' + announcement.ToLocation.map((l) => l.LocationName).join()
			: '';
		const speed = position.Speed ? '<br>' + position.Speed + ' km/h' : '';
		return product + position.Train.AdvertisedTrainNumber + to + speed;
	}

	function wgs84(s) {
		return s
			.match(/POINT \(([^ ]+) ([^ ]+)\)/)
			.slice(1)
			.map(Number);
	}
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
