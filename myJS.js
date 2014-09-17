window.onload = myFunc;

function myFunc() {
	d3.select('#hpms-map')
		.attr('width', window.innerWidth)
		.attr('height', window.innerHeight-30);

	d3.select('#hpms-graphs')
		.attr('width', window.innerWidth)
		.attr('height', window.innerHeight-30);

	hpms.init();
}