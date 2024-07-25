export default (array, callback) => array.reduce((acc, item) => {
	const key = callback(item);
	if (!acc[key]) {
		acc[key] = [];
	}
	acc[key].push(item);
	return acc;
}, {});