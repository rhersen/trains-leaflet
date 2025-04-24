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

export function code(position, announcements) {
	const announcement = announcements[position.Train.AdvertisedTrainNumber];
	return announcement ? announcement.ProductInformation.map((p) => p.Code).join(' ') : '';
}
