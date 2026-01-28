const apiUrl = 'https://api.trafikinfo.trafikverket.se/v2/data.json';
const headers = { 'Content-Type': 'application/xml', Accept: 'application/json' };

export const load = async ({ url }) => {
	const trains = url.searchParams.getAll('train');
	if (trains.length === 0) return { announcements: [] };

	const response = await fetch(apiUrl, {
		method: 'POST',
		body: announcementQuery(trains.join()),
		headers
	});

	if (!response.ok) {
		console.error('Failed to fetch announcements:', response.statusText);
		return { announcements: [] };
	}

	const { RESPONSE } = await response.json();
	const [result] = RESPONSE.RESULT;
	return { announcements: result?.TrainAnnouncement || [] };
};

function announcementQuery(trains) {
	return `
<REQUEST>
  <LOGIN authenticationkey='${process.env.TRAFIKVERKET_API_KEY}' />
    <QUERY objecttype='TrainAnnouncement' orderby='AdvertisedTimeAtLocation' schemaversion='1.6'>
      <FILTER>
       	<IN name='AdvertisedTrainIdent' value='${trains}' />
        <EXISTS name='ToLocation' value='true' />
      </FILTER>
      <INCLUDE>AdvertisedTrainIdent</INCLUDE>
      <INCLUDE>FromLocation</INCLUDE>
      <INCLUDE>ProductInformation</INCLUDE>
      <INCLUDE>ToLocation</INCLUDE>
    </QUERY>
</REQUEST>`;
}
