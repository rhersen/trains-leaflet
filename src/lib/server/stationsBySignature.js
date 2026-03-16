import { wgs84 } from '$lib/utils';

export default async function stationsBySignature() {
	console.log('Fetching stations from Trafikverket API');
	const result = await fetchTrafikverket(trainStationQuery(process.env.TRAFIKVERKET_API_KEY));
	const stations = result.TrainStation ?? [];
	return Object.fromEntries(
		stations.map((station) => {
			const coordinates = station?.Geometry?.WGS84 ? wgs84(station.Geometry.WGS84) : null;
			return [station.LocationSignature, { ...station, coordinates }];
		})
	);
}

async function fetchTrafikverket(body) {
	const API_URL = 'https://api.trafikinfo.trafikverket.se/v2/data.json';
	const headers = {
		'Content-Type': 'application/xml',
		Accept: 'application/json'
	};

	const response = await fetch(API_URL, {
		method: 'POST',
		body,
		headers
	});

	if (!response.ok) {
		throw new Error(`Trafikverket request failed: ${response.status} ${response.statusText}`);
	}

	const payload = await response.json();
	const [result] = payload?.RESPONSE?.RESULT ?? [];

	if (!result) {
		throw new Error('Invalid response from Trafikverket API');
	}

	if (result.ERROR) {
		throw new Error(result.ERROR.MESSAGE || 'Trafikverket API returned an error');
	}

	return result;
}

function trainStationQuery(apiKey) {
	return `
<REQUEST>
  <LOGIN authenticationkey='${apiKey}' />
  <QUERY objecttype='TrainStation' namespace='rail.infrastructure' schemaversion='1.5'>
    <FILTER>
      <EQ name='Deleted' value='false' />
    </FILTER>
    <INCLUDE>Advertised</INCLUDE>
    <INCLUDE>AdvertisedShortLocationName</INCLUDE>
    <INCLUDE>Geometry</INCLUDE>
    <INCLUDE>LocationSignature</INCLUDE>
  </QUERY>
</REQUEST>`;
}
