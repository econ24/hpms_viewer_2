window.onload = myFunc;

function myFunc() {
	d3.select('#hpms-map')
		.style('width', window.innerWidth+'px')
		.style('height', (window.innerHeight-30)+'px');

	d3.select('#hpms-interstates')
		.style('width', window.innerWidth+'px')
		.style('height', (window.innerHeight-30)+'px');

	d3.select('#hpms-data')
		.attr('width', window.innerWidth+'px')
		.attr('height', (window.innerHeight-30)+'px');

	hpms_menu.init();
	hpms_map.init();
	hpms_data.init();
	hpms_interstates.init();
}