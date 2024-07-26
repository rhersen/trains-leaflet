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
	const product = announcement
		? announcement.ProductInformation.map((p) => p.Description).join(' ') + ' '
		: '';
	const to = announcement
		? '<br>mot ' + announcement.ToLocation.map((l) => l.LocationName).join()
		: '';
	const speed = position.Speed ? '<br>' + position.Speed + ' km/h' : '';
	return product + position.Train.AdvertisedTrainNumber + to + speed;
}

export function wgs84(s) {
	return s
		.match(/POINT \(([^ ]+) ([^ ]+)\)/)
		.slice(1)
		.map(Number);
}

export function code(position, announcements) {
	const announcement = announcements[position.Train.AdvertisedTrainNumber];
	return announcement ? announcement.ProductInformation.map((p) => p.Code).join(' ') : '';
}