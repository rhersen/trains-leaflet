<script>
	import { onMount } from 'svelte';

	let queryString = '';

	onMount(() => {
		navigator.geolocation.getCurrentPosition(
			({ coords }) => {
				console.log(coords);
				const query = new URLSearchParams();
				query.set('latitude', coords.latitude);
				query.set('longitude', coords.longitude);
				queryString = query.toString();
			},
			(error) => {
				console.error(error);
			}
		);
	});
</script>

<ul>
	<li><a href="pendel">pendel</a></li>
	<li><a href="race">race</a></li>
	<li><a href="recent">senaste</a></li>
	<li><a href="geolocation?{queryString}">geolocation</a></li>
	<li><a href="animering">animering</a></li>
</ul>

<style>
	ul {
		font-family: sans-serif;
		font-size: 30px;
	}
</style>
