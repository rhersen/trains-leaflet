<script>
	import { onDestroy, onMount } from 'svelte';
	import { icon, groupAnnouncements } from '$lib/utils';

	export let data;

	let mapElement;
	let map;
	let L;
	const markers = {};
	const trainPositions = {};
	let announcements = {};

	let startTime = 0;
	let endTime = 0;
	let sliderValue = 0;

	$: formattedTime = new Date(sliderValue).toLocaleTimeString('sv-SE', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	});

	function findNearestPosition(positions, time) {
		if (!positions || positions.length === 0) return null;

		let nearest = null;
		let nearestDiff = Infinity;

		for (const position of positions) {
			const positionTime = new Date(position.timestamp).getTime();
			const timeDiff = Math.abs(positionTime - time);

			if (timeDiff < nearestDiff) {
				nearest = position;
				nearestDiff = timeDiff;
			}
		}

		return nearest;
	}

	function popupText(trainId, position) {
		const announcement = announcements[trainId];
		const from = announcement?.FromLocation
			? `<br>${announcement.FromLocation.map((l) => l.LocationName).join()}`
			: '';
		const to = announcement?.ToLocation
			? `–${announcement.ToLocation.map((l) => l.LocationName).join()}`
			: '';
		const speed = position.speed ? `<br>${position.speed} km/h` : '';
		return [trainId, from, to, speed].join('');
	}

	function renderForTime(time) {
		if (!map || !L) return;

		for (const trainId of Object.keys(trainPositions)) {
			const position = findNearestPosition(trainPositions[trainId], time);
			if (
				position &&
				typeof position.latitude === 'number' &&
				typeof position.longitude === 'number'
			) {
				const latLng = [position.latitude, position.longitude];
				const markerIcon = L.icon(icon(position.bearing ?? 0, -1));
				const popup = popupText(trainId, position);

				if (markers[trainId]) {
					markers[trainId].setLatLng(latLng);
					markers[trainId].setIcon(markerIcon);
					markers[trainId].setPopupContent(popup);
				} else {
					markers[trainId] = L.marker(latLng, { icon: markerIcon });
					markers[trainId].bindPopup(popup);
					markers[trainId].addTo(map);
				}
			}
		}
	}

	function handleSliderChange() {
		renderForTime(sliderValue);
	}

	async function fetchPositionsForTrain(trainId) {
		const today = new Date().toLocaleDateString('sv-SE');
		const response = await fetch(`http://trains.hersen.name/api/positions/${trainId}/${today}`);
		if (!response.ok) {
			console.error('Failed to fetch train:', trainId, response.statusText);
			return [];
		}
		return response.json();
	}

	async function fetchAllPositions() {
		const positionsPerTrain = await Promise.all(
			data.trains.map((trainId) => fetchPositionsForTrain(trainId))
		);

		data.trains.forEach((trainId, index) => {
			trainPositions[trainId] = positionsPerTrain[index];
		});

		const allTimestamps = positionsPerTrain.flatMap((positions) =>
			positions.map((p) => new Date(p.timestamp).getTime())
		);

		if (allTimestamps.length > 0) {
			startTime = Math.min(...allTimestamps);
			endTime = Math.max(...allTimestamps);
			sliderValue = startTime;
		}
	}

	onMount(async () => {
		const promise = fetchAllPositions();
		L = await import('leaflet');

		map = L.map(mapElement).setView([59.33, 18.07], 9);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
		L.tileLayer('https://c.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png').addTo(map);

		announcements = groupAnnouncements(data.announcements);
		await promise;
	});

	onDestroy(() => {
		if (map) {
			console.log('Unloading Leaflet map.');
			map.remove();
		}
	});
</script>

<main>
	<div bind:this={mapElement}></div>
	<div class="slider-container">
		<input
			type="range"
			min={startTime}
			max={endTime}
			bind:value={sliderValue}
			step={5000}
			on:input={handleSliderChange}
		/>
		<span class="time-label">{formattedTime}</span>
	</div>
</main>

<style>
	@import 'leaflet/dist/leaflet.css';
	main div {
		height: 640px;
	}
	.slider-container {
		height: auto;
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
	}
	.slider-container input[type='range'] {
		flex: 1;
	}
	.time-label {
		font-family: monospace;
		font-size: 1.2rem;
	}
</style>
