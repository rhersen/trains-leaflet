import { error } from '@sveltejs/kit';

async function positionResult() {
	const response = await fetch('https://api.trafikinfo.trafikverket.se/v2/data.json', {
		method: 'POST',
		body: positionQuery(),
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

export const load = async ({ params }) => {
	const { positions, ssePosition } = await positionResult(params.train);
	return {
		positions: [
			{
				Train: { AdvertisedTrainNumber: 'Årstaberg spår 2' },
				Position: { WGS84: 'POINT (18.030222192221505 59.30039120332699)' }
			},
			{
				Train: { AdvertisedTrainNumber: 'Huddinge kyrka' },
				Position: { WGS84: 'POINT (17.98392234066254 59.239807195772435)' }
			},
			{
				Train: { AdvertisedTrainNumber: 'Tegnérlunden' },
				Position: { WGS84: 'POINT (18.057369780150907 59.33737318372794)' }
			},
			{
				Train: { AdvertisedTrainNumber: 'City spår 3' },
				Position: { WGS84: 'POINT (18.05854634121404 59.33383190994468)' }
			},
			{
				Train: { AdvertisedTrainNumber: 'Riddarholmen' },
				Position: { WGS84: 'POINT (18.0634182994254 59.324461473129446)' }
			},
			{
				Train: { AdvertisedTrainNumber: 'Tegelbacken' },
				Position: { WGS84: 'POINT (18.059209705732364 59.330257744286435)' }
			},
			{
				Train: { AdvertisedTrainNumber: 'City spår 4' },
				Position: { WGS84: 'POINT (18.058900590570143 59.33385953614067)' }
			},
			{
				Train: { AdvertisedTrainNumber: 'Röda bergen' },
				Position: { WGS84: 'POINT (18.035697719703634 59.34484438160129)' }
			},
			{
				Train: { AdvertisedTrainNumber: 'Tanto' },
				Position: { WGS84: 'POINT (18.046534053801665 59.31106360231437)' }
			},
			{
				Train: { AdvertisedTrainNumber: 'Södra spår 2' },
				Position: { WGS84: 'POINT (18.059833112065075 59.31333978941172)' }
			},
			{
				Train: { AdvertisedTrainNumber: 'Odenplan spår 2' },
				Position: { WGS84: 'POINT (18.043334024443165 59.34426183658227)' }
			},
			{
				Train: { AdvertisedTrainNumber: 'Årstaberg spår 3' },
				Position: { WGS84: 'POINT (18.024706911894015 59.2980392808239)}}' }
			}
		],
		announcements: []
	};
};

const minutes = 6e4;

// ^(?:2[2-9][0-9]{2}|12[89][0-9]{2}|52[2-7][0-9]{2})$

function positionQuery() {
	const since = new Date(Date.now() - 30 * minutes).toISOString();
	return `
<REQUEST>
  <LOGIN authenticationkey='${process.env.TRAFIKVERKET_API_KEY}' />
    <QUERY objecttype='TrainPosition' namespace='järnväg.trafikinfo' sseurl='true' schemaversion='1.1'>
    <FILTER>
      <GT name='TimeStamp' value='${since}'/>
     	<LIKE name='Train.AdvertisedTrainNumber' value='/^(?:2[2-9][0-9]{2}|12[89][0-9]{2}|52[2-7][0-9]{2})$/' />
    </FILTER>
    <INCLUDE>Bearing</INCLUDE>
    <INCLUDE>Position</INCLUDE>
    <INCLUDE>Speed</INCLUDE>
    <INCLUDE>TimeStamp</INCLUDE>
    <INCLUDE>Train</INCLUDE>
  </QUERY>
</REQUEST>`;
}
