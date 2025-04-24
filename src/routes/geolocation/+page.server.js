import { error } from '@sveltejs/kit';

async function positionResult(longitude, latitude) {
	const response = await fetch('https://api.trafikinfo.trafikverket.se/v2/data.json', {
		method: 'POST',
		body: positionQuery(longitude, latitude),
		headers: {
			'Content-Type': 'application/xml',
			Accept: 'application/json'
		}
	});

	if (!response.ok) throw error(response.status, response.statusText);

	const { RESPONSE } = await response.json();
	const [result] = RESPONSE.RESULT;
	return { positions: result.TrainPosition, ssePosition: result.INFO?.SSEURL };
}

export const load = async ({ url }) => {
	const longitude = url.searchParams.get('longitude');
	const latitude = url.searchParams.get('latitude');
	if (longitude && latitude) {
		const { positions, ssePosition } = await positionResult(longitude, latitude);
		return { positions, announcements: [], ssePosition };
	} else return { positions: [], announcements: [] };
};

const minutes = 6e4;

function positionQuery(longitude, latitude) {
	const since = new Date(Date.now() - 2 * minutes).toISOString();
	return `
<REQUEST>
  <LOGIN authenticationkey='${process.env.TRAFIKVERKET_API_KEY}' />
    <QUERY objecttype='TrainPosition' namespace='järnväg.trafikinfo' sseurl='true' schemaversion='1.1'>
    <FILTER>
      <GT name='TimeStamp' value='${since}'/>
      <WITHIN name="Position.WGS84" shape="center" value="${longitude} ${latitude}" radius="16000m" />
    </FILTER>
    <INCLUDE>Bearing</INCLUDE>
    <INCLUDE>Position</INCLUDE>
    <INCLUDE>Speed</INCLUDE>
    <INCLUDE>TimeStamp</INCLUDE>
    <INCLUDE>Train</INCLUDE>
  </QUERY>
</REQUEST>`;
}
