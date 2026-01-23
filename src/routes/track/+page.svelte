<script>
	import { onDestroy, onMount } from 'svelte';
	import { icon } from '$lib/utils';

	export let data;

	let mapElement;
	let map;
	let L;
	let marker;
	let positions = [];

	let startTime = 0;
	let endTime = 0;
	let sliderValue = 0;

	$: formattedTime = new Date(sliderValue).toLocaleTimeString('sv-SE', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	});

	function findNearestPosition(time) {
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

	function renderForTime(time) {
		if (!map || !L) return;

		const position = findNearestPosition(time);
		if (!position) return;
		if (typeof position.latitude !== 'number' || typeof position.longitude !== 'number') return;

		const latLng = [position.latitude, position.longitude];
		const markerIcon = L.icon(icon(position.bearing ?? 0, -1));

		if (marker) {
			marker.setLatLng(latLng);
			marker.setIcon(markerIcon);
		} else {
			marker = L.marker(latLng, { icon: markerIcon });
			marker.addTo(map);
		}
	}

	function handleSliderChange() {
		renderForTime(sliderValue);
	}

	async function fetchPositions() {
		const response = await fetch(
			`http://trains.hersen.name/api/positions/${data.train}/2026-01-23`
		);
		if (!response.ok) {
			console.error('Failed to fetch trains:', response.statusText);
			return [];
		}
		return response.json();
	}

	onMount(async () => {
		L = await import('leaflet');

		map = L.map(mapElement).setView([59.33, 18.07], 9);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
		L.tileLayer('https://c.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png').addTo(map);

		positions = await fetchPositions();

		if (positions.length > 0) {
			const timestamps = positions.map((p) => new Date(p.timestamp).getTime());
			startTime = Math.min(...timestamps);
			endTime = Math.max(...timestamps);
			sliderValue = startTime;
		}
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
