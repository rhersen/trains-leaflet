import { error } from '@sveltejs/kit';

const apiUrl = 'https://api.trafikinfo.trafikverket.se/v2/data.json';
const headers = { 'Content-Type': 'application/xml', Accept: 'application/jsn' };

export const load = async () => {
	const positions = await fetchTrafikverket(positionQuery());
	const announcements = await fetchTrafikverket(
		announcementQuery(
			positions.TrainPosition.map(({ Train }) => Train.AdvertisedTrainNumber).join()
		)
	);
	return { positions, announcements };
};

async function fetchTrafikverket(body) {
	const response = await fetch(apiUrl, { method: 'POST', body, headers });

	if (!response.ok) throw error(response.status, response.statusText);

	const { RESPONSE } = await response.json();
	const [result] = RESPONSE.RESULT;
	return result;
}

const minutes = 6e4;

function positionQuery() {
	const since = new Date(Date.now() - 8 * minutes).toISOString();
	return `
<REQUEST>
  <LOGIN authenticationkey='${process.env.TRAFIKVERKET_API_KEY}' />
    <QUERY objecttype='TrainPosition' namespace='järnväg.trafikinfo' sseurl='true' schemaversion='1.1'>
    <FILTER>
      <GT name='TimeStamp' value='${since}'/>
     	<LIKE name='Train.AdvertisedTrainNumber' value='/^(?:2[2-9]\\d\\d|12[89]\\d\\d|52[2-7]\\d\\d)$/' />
    </FILTER>
    <INCLUDE>Bearing</INCLUDE>
    <INCLUDE>Position</INCLUDE>
    <INCLUDE>Speed</INCLUDE>
    <INCLUDE>TimeStamp</INCLUDE>
    <INCLUDE>Train</INCLUDE>
  </QUERY>
</REQUEST>`;
}

function announcementQuery(trains) {
	const since = new Date(Date.now() - 8 * minutes).toISOString();
	return `
<REQUEST>
  <LOGIN authenticationkey='${process.env.TRAFIKVERKET_API_KEY}' />
    <QUERY objecttype='TrainAnnouncement' orderby='AdvertisedTimeAtLocation' sseurl='true' schemaversion='1.6'>
      <FILTER>
       	<IN name='AdvertisedTrainIdent' value='${trains}' />
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
