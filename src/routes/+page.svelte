<script>
	import locations from '$lib/short.json';

	export let data;

	// Function to format date string
	function formatDateTime(dateString) {
		return dateString.substring(11, 19);
	}

	// Function to get descriptions from ProductInformation
	function getDescriptions(productInfo) {
		if (!productInfo || !Array.isArray(productInfo)) return '-';
		return productInfo.map((p) => p.Description).join(' ');
	}

	// Function to get destination
	function getDestination(toLocation) {
		if (!toLocation || toLocation.length === 0) return '-';
		return locations[toLocation[0].LocationName];
	}
</script>

<div class="table-container">
	<table>
		<thead>
			<tr>
				<th>Description</th>
				<th>Train ID</th>
				<th>Destination</th>
				<th>Location</th>
				<th>Actual Time</th>
			</tr>
		</thead>
		<tbody>
			{#each data.TrainAnnouncement as announcement}
				<tr>
					<td>{getDescriptions(announcement.ProductInformation)}</td>
					<td>
						<a href={announcement.AdvertisedTrainIdent}>
							{announcement.AdvertisedTrainIdent}
						</a>
					</td>
					<td>{getDestination(announcement.ToLocation)}</td>
					<td>{locations[announcement.LocationSignature]}</td>
					<td>{formatDateTime(announcement.TimeAtLocationWithSeconds)}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table-container {
		margin: 20px;
		overflow-x: auto;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		background-color: white;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
		font-size: 16px;
		line-height: 1.2;
	}

	th,
	td {
		padding: 8px 12px;
		text-align: left;
		border-bottom: 1px solid #ddd;
	}

	th {
		background-color: #f4f4f4;
		font-weight: 600;
	}

	tr:hover {
		background-color: #f5f5f5;
	}

	@media screen and (max-width: 600px) {
		.table-container {
			margin: 10px;
		}

		table {
			font-size: 14px;
		}

		th,
		td {
			padding: 6px 8px;
		}
	}
</style>
