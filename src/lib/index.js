import { parseISO } from 'date-fns';

function groupBy(array, callback) {
	const acc = {};
	array.forEach((item) => {
		const key = callback(item);
		if (!acc[key]) acc[key] = [];
		acc[key].push(item);
	});
	return acc;
}

export function groupAnnouncements(array) {
	return Object.fromEntries(
		Object.entries(groupBy(array, (a) => a.AdvertisedTrainIdent)).map(([train, [announcement]]) => [
			train,
			announcement
		])
	);
}

export function popupText(position, announcements) {
	const announcement = announcements[position.Train.AdvertisedTrainNumber];
	const from = announcement
		? ' ' + announcement.FromLocation.map((l) => l.LocationName).join()
		: '';
	const to = announcement ? '–' + announcement.ToLocation.map((l) => l.LocationName).join() : '';
	const speed = position.Speed ? '<br>' + position.Speed + ' km/h' : '';
	return position.Train.AdvertisedTrainNumber + from + to + speed;
}

export function wgs84(s) {
	const array = s
		.match(/POINT \(([^ ]+) ([^ ]+)\)/)
		.slice(1)
		.map(Number);
	array.reverse();
	return array;
}

export function interpolate(positions, now) {
	const t = now - 30000;
	if (!positions.length) return [];
	if (positions.length === 1) return wgs84(positions[0].Position.WGS84);
	let i = positions.findIndex((p) => parseISO(p.TimeStamp).getTime() < t);
	if (i === 0) return wgs84(positions[0].Position.WGS84);
	if (i === -1) i = positions.length - 1;
	let j = i - 1;
	if (positions[i].Position.WGS84 === positions[j].Position.WGS84 && i < positions.length - 1) ++i;
	const t0 = parseISO(positions[j].TimeStamp).getTime();
	const t1 = parseISO(positions[i].TimeStamp).getTime();
	const p0 = wgs84(positions[j].Position.WGS84);
	const p1 = wgs84(positions[i].Position.WGS84);

	return [
		p0[0] + ((p1[0] - p0[0]) * (t - t0)) / (t1 - t0),
		p0[1] + ((p1[1] - p0[1]) * (t - t0)) / (t1 - t0)
	];
}

export function code(position, announcements) {
	const announcement = announcements[position.Train.AdvertisedTrainNumber];
	return announcement ? announcement.ProductInformation.map((p) => p.Code).join(' ') : '';
}
