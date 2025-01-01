import { error } from '@sveltejs/kit';
import { formatISO, sub } from 'date-fns';

// noinspection JSUnusedGlobalSymbols
export const load = async ({ params }) => {
	const { TrainAnnouncement, INFO } = await fetchAnnouncements(params);
	TrainAnnouncement.reverse();
	return {
		sseUrl: INFO?.SSEURL,
		TrainAnnouncement
	};
};

async function fetchAnnouncements() {
	console.time('fetch');
	const r = await fetch('https://api.trafikinfo.trafikverket.se/v2/data.json', {
		method: 'POST',
		body: getBody(),
		headers: {
			'Content-Type': 'application/xml',
			Accept: 'application/json'
		}
	});
	console.timeEnd('fetch');
	if (!r.ok) {
		console.log(await r.text());
		throw error(r.status, r.statusText);
	}

	const { RESPONSE } = await r.json();
	const [announcements] = RESPONSE.RESULT;
	return announcements;
}

function getBody() {
	const now = Date.now();
	const since = formatISO(sub(now, { minutes: 3 }));
	console.log(since);
	return `
        <REQUEST>
            <LOGIN authenticationkey='${process.env.TRAFIKVERKET_API_KEY}'/>
            <QUERY sseurl='true' objecttype='TrainAnnouncement' orderby='TimeAtLocationWithSeconds' schemaversion='1.6'>
                <FILTER>
                    <GT name='TimeAtLocationWithSeconds' value='${since}'/>
                    <EQ name='ActivityType' value='Avgang'/>
                    <EXISTS name='ProductInformation' value='true' />
                </FILTER>
                <INCLUDE>ActivityType</INCLUDE>
                <INCLUDE>AdvertisedTrainIdent</INCLUDE>
                <INCLUDE>AdvertisedTimeAtLocation</INCLUDE>
                <INCLUDE>LocationSignature</INCLUDE>
                <INCLUDE>ProductInformation</INCLUDE>
                <INCLUDE>TimeAtLocation</INCLUDE>
                <INCLUDE>TimeAtLocationWithSeconds</INCLUDE>
                <INCLUDE>ToLocation</INCLUDE>
            </QUERY>
        </REQUEST>`;
}
