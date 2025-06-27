// place files you want to import through the `$lib` alias in this folder.

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
		? '<br>' + announcement.FromLocation.map((l) => l.LocationName).join()
		: '';
	const to = announcement ? '–' + announcement.ToLocation.map((l) => l.LocationName).join() : '';
	const speed = position.Speed ? '<br>' + position.Speed + ' km/h' : '';
	const prod = announcement ? announcement?.ProductInformation[0].Description + ' ' : '';
	return prod + position.Train.AdvertisedTrainNumber + from + to + speed;
}

export function wgs84(s) {
	const array = s
		.match(/POINT \(([^ ]+) ([^ ]+)\)/)
		.slice(1)
		.map(Number);
	array.reverse();
	return array;
}

export function code(position, announcements) {
	const announcement = announcements[position.Train.AdvertisedTrainNumber];
	return announcement ? announcement.ProductInformation.map((p) => p.Code).join(' ') : '';
}

export function icon(bearing, hue) {
	const outlined = `<polygon points="0,-25 17.68,17.68 -17.68,17.68" fill="none" stroke="black" stroke-width="10" />`;
	const filled = `<polygon points="0,-25 17.68,17.68 -17.68,17.68" fill="none" stroke="hsl(${hue} ${hue === -1 ? '0%' : '100%'} 50%)" stroke-width="6" />`;
	const g = `<g transform="translate(32,32) rotate(${bearing},0,0)">${outlined}${filled}</g>`;
	const svg = `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">${g}</svg>`;
	return {
		iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
		iconSize: [32, 32],
		iconAnchor: [16, 16],
		popupAnchor: [0, -16]
	};
}
