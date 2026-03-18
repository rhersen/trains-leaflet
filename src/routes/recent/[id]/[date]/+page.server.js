import { error } from '@sveltejs/kit';

const API_URL = 'https://api.trafikinfo.trafikverket.se/v2/data.json';
const headers = { 'Content-Type': 'application/xml', Accept: 'application/json' };

export const load = async ({ params }) => {
	const positionPromise = positionResult(params.id, params.date);
	const announcementPromise = announcementResult(params.id, params.date);

	const { positions, ssePosition } = await positionPromise;
	const { announcements } = await announcementPromise;

	return { positions, announcements, ssePosition };
};

async function positionResult(id, date) {
	const result = await fetchTrafikverket(positionQuery(id, date));
	return { positions: result.TrainPosition ?? [], ssePosition: result.INFO?.SSEURL };
}

function positionQuery(id, date) {
	return `
<REQUEST>
  <LOGIN authenticationkey='${process.env.TRAFIKVERKET_API_KEY}' />
    <QUERY objecttype='TrainPosition' namespace='järnväg.trafikinfo' sseurl='true' schemaversion='1.1'>
    <FILTER>
      <EQ name="Train.AdvertisedTrainNumber" value='${id}'/>
      <EQ name="Train.OperationalTrainDepartureDate" value='${date}'/>
    </FILTER>
    <INCLUDE>Bearing</INCLUDE>
    <INCLUDE>Position</INCLUDE>
    <INCLUDE>Speed</INCLUDE>
    <INCLUDE>TimeStamp</INCLUDE>
    <INCLUDE>Train</INCLUDE>
  </QUERY>
</REQUEST>`;
}

async function announcementResult(id, date) {
	const result = await fetchTrafikverket(announcementQuery(id, date));
	return { announcements: result.TrainAnnouncement ?? [] };
}

function announcementQuery(id, date) {
	return `
<REQUEST>
  <LOGIN authenticationkey='${process.env.TRAFIKVERKET_API_KEY}' />
    <QUERY objecttype='TrainAnnouncement' orderby='AdvertisedTimeAtLocation' sseurl='false' schemaversion='1.6'>
      <FILTER>
        <EQ name='AdvertisedTrainIdent' value='${id}' />
        <EQ name='ScheduledDepartureDateTime' value='${date}' />
        <EXISTS name='ToLocation' value='true' />
      </FILTER>
      <INCLUDE>ActivityType</INCLUDE>
      <INCLUDE>AdvertisedTrainIdent</INCLUDE>
      <INCLUDE>FromLocation</INCLUDE>
      <INCLUDE>LocationSignature</INCLUDE>
      <INCLUDE>ProductInformation</INCLUDE>
      <INCLUDE>ScheduledDepartureDateTime</INCLUDE>
      <INCLUDE>TimeAtLocationWithSeconds</INCLUDE>
      <INCLUDE>ToLocation</INCLUDE>
    </QUERY>
</REQUEST>`;
}

async function fetchTrafikverket(body) {
	const response = await fetch(API_URL, { method: 'POST', body, headers });

	if (!response.ok) throw error(response.status, response.statusText);

	const { RESPONSE } = await response.json();
	const [result] = RESPONSE.RESULT;
	return result;
}
