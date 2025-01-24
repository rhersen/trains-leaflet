import { error } from '@sveltejs/kit';

async function positionResult(direction) {
	const response = await fetch('https://api.trafikinfo.trafikverket.se/v2/data.json', {
		method: 'POST',
		body: positionQuery(direction === 'n' ? '02468' : '13579'),
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

async function announcementResult(direction) {
	const response = await fetch('https://api.trafikinfo.trafikverket.se/v2/data.json', {
		method: 'POST',
		body: announcementQuery(direction === 'n' ? '02468' : '13579'),
		headers: {
			'Content-Type': 'application/xml',
			Accept: 'application/json'
		}
	});

	if (!response.ok) throw error(response.status, response.statusText);

	const { RESPONSE } = await response.json();
	const [result] = RESPONSE.RESULT;
	return { announcements: result.TrainAnnouncement, sseAnnouncement: result.INFO?.SSEURL };
}

export const load = async ({ params }) => {
	const { positions, ssePosition } = await positionResult(params.direction);
	const { announcements, sseAnnouncement } = await announcementResult(params.direction);
	return { positions, announcements, ssePosition, sseAnnouncement };
};

const minutes = 6e4;

function positionQuery(dir) {
	const since = new Date(Date.now() - 8 * minutes).toISOString();
	return `
<REQUEST>
  <LOGIN authenticationkey='${process.env.TRAFIKVERKET_API_KEY}' />
    <QUERY objecttype='TrainPosition' namespace='järnväg.trafikinfo' sseurl='true' schemaversion='1.1'>
    <FILTER>
      <GT name='TimeStamp' value='${since}'/>
     	<LIKE name='Train.AdvertisedTrainNumber' value='/^(?:2[2-9][0-9][${dir}]|12[89][0-9][${dir}]|52[2-7][0-9][${dir}])$/' />
    </FILTER>
    <INCLUDE>Bearing</INCLUDE>
    <INCLUDE>Position</INCLUDE>
    <INCLUDE>Speed</INCLUDE>
    <INCLUDE>TimeStamp</INCLUDE>
    <INCLUDE>Train</INCLUDE>
  </QUERY>
</REQUEST>`;
}

function announcementQuery(dir) {
	const since = new Date(Date.now() - 4 * minutes).toISOString();
	return `
<REQUEST>
  <LOGIN authenticationkey='${process.env.TRAFIKVERKET_API_KEY}' />
    <QUERY objecttype='TrainAnnouncement' orderby='AdvertisedTimeAtLocation' sseurl='true' schemaversion='1.6'>
      <FILTER>
       	<LIKE name='AdvertisedTrainIdent' value='/^(?:2[2-9][0-9][${dir}]|12[89][0-9][${dir}]|52[2-7][0-9][${dir}])$/' />
        <GT name='TimeAtLocationWithSeconds' value='${since}' />
        <EXISTS name='ToLocation' value='true' />
      </FILTER>
      <INCLUDE>ActivityType</INCLUDE>
      <INCLUDE>AdvertisedTimeAtLocation</INCLUDE>
      <INCLUDE>LocationSignature</INCLUDE>
      <INCLUDE>TimeAtLocationWithSeconds</INCLUDE>
      <INCLUDE>AdvertisedTrainIdent</INCLUDE>
      <INCLUDE>FromLocation</INCLUDE>
      <INCLUDE>ProductInformation</INCLUDE>
      <INCLUDE>ToLocation</INCLUDE>
    </QUERY>
</REQUEST>`;
}
