export default (array, callback) => {
	const acc = {};
	array.forEach((item) => {
		const key = callback(item);
		if (!acc[key]) acc[key] = [];
		acc[key].push(item);
	});
	return acc;
};
