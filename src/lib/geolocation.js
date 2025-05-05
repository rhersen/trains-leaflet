let iconSize = {
	iconSize: [32, 32],
	iconAnchor: [16, 16],
	popupAnchor: [0, -16]
};

export function createLeafletIcon(code, leaflet) {
	let color = 'grey';
	if (code === 'PNA014' || code === 'PNA040' || code === 'PNA041') color = 'blue';
	if (code === 'PNA065') color = 'red';
	if (code === 'PNA038' || code === 'PNA098') color = 'yellow';
	if (code === 'PNA021') color = 'brown';
	if (code === 'PNA023' || code === 'PNA025' || code === 'PNA026') color = 'green';
	if (code.startsWith('PNA054') || code === 'PNA010' || code === 'PNA043') color = 'cyan';
	const circle = `<circle cx="32" cy="32" r="25" fill="none" stroke="${color}" stroke-width="12" />`;
	const svg = `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">${circle}</svg>`;
	return leaflet.icon({
		...iconSize,
		iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`
	});
}
