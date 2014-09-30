(function() {
	var overlay = {};

	var SPACE_BAR = 1,
		ESC_KEY = 2;

	var SPACE_BAR_DOWN = SPACE_BAR,
		ESC_KEY_DOWN = ESC_KEY;

	var SPACE_BAR_UP = -SPACE_BAR,
		ESC_KEY_UP = -ESC_KEY;

	var BUTTON_MAP = {
		32: SPACE_BAR,
		27: ESC_KEY
	};

	var uniqueZones = 1;

	var twoPI = Math.PI*2;

	function MapZone() {
		var data = [],
			svg = null,
			visible = true;

		function zone() {
			var zones = svg.selectAll('circle')
				.data(data, function(d) { return d.id; });

			zones.exit()
				.transition().duration(500)
				.attr('r', 0)
				.remove();

			zones.enter().append('circle')
				.attr('class', 'hpms-interstates-zone')
				.attr('r', function(d) { return d.r; });

			zones.classed('hpms-interstates-zone-hide', !visible)
				.attr('cx', function(d) { return d.cx; })
				.attr('cy', function(d) { return d.cy; });
		}
		zone.init = function(s) {
			svg = s.append('g');

			return zone;
		}
		zone.data = function(d) {
			if (!arguments.length) {
				return data;
			}
			data = d;
			return zone;
		}
		zone.visible = function(bool) {
			if (!arguments.length) {
				return visible;
			}
			visible = bool;
			return zone;
		}
		zone.transition = function() {
			var zones = svg.selectAll('circle')
				.data(data);

			zones.transition().duration(500)
				.attr('r', function(d) { return d.r; });

			return zone;
		}
		zone.getData = function(root) {
			var text = [];
			data.forEach(function(d, i) {
				var AADT = 0,
					AADTcount = 0,
					routes = {},

					circle= objects.Circle(d.cx, d.cy, d.r),
					rect = objects.Rect(d.cx-d.r, d.cy-d.r, d.r*2, d.r*2);

				root.visit.call(d, travelTree);

				function travelTree(node, x1, y1, x2, y2) {
					if (node.point && node.point.circle && circle.collideCircle(node.point.circle)) {
						AADT += node.point.properties.aadt;
						AADTcount++;
						if (!(node.point.properties.route in routes)) {
							routes[node.point.properties.route] = {segments: 0, aadt: 0};
						}
						routes[node.point.properties.route].segments++;
						routes[node.point.properties.route].aadt+=node.point.properties.aadt;
					}

					var r = objects.Rect(x1, y1, x2-x1, y2-y1);

					return !rect.collideRect(r);
				}
				if (AADTcount) {
					text.push({aadt:AADT, count:AADTcount,routes:routes,data:d});
				}
			})
			return text;
		}

		return zone;
	}

	overlay.MapMonitor = function() {
		var clicks = [],
			clickZones = null,
			clickPopup = avlmenu.Popup()
				.position('bottom-right')
				.visible(false),
			hoverZone = null,
			hoverPopup = avlmenu.Popup()
				.position('top-right')
				.visible(false),
			projection = null,
			input = null,
			processInput = false,
			radii = [8, 16, 32],
			index = 1,
			radius = radii[index],
			loc = [0, 0],
			circle = null;

		function monitor(d) {
			loc = d3.mouse(this);

			hoverZone.data([{cx:loc[0], cy:loc[1], r:radius, id:0}])();

			updatePopupText(hoverZone, hoverPopup, d);
		}
		monitor.init = function(svg) {
			clickZones = MapZone()
				.init(svg);

			hoverZone = MapZone()
				.init(svg);

			d3.select('#hpms-interstates').call(clickPopup.init);
			d3.select('#hpms-interstates').call(hoverPopup.init);

			input = new Input();
			input.init(BUTTON_MAP);

			return monitor;
		}
		monitor.enter = function(d) {
			loc = d3.mouse(this);

			hoverZone.visible(true);

			processInput = setInterval(checkInput.bind(this, d), 25);

			return monitor;
		}
		monitor.exit = function(d) {
			hoverZone.visible(false)();

			clearInterval(processInput);
		}
		monitor.click = function(d) {
			loc = d3.mouse(this);

			var ndx = checkForClickedZone(loc);
			if (ndx >= 0) {
				clicks.splice(ndx, 1);
			}
			else {
				var obj = {
					cx: loc[0],
					cy: loc[1],
					r: radius,
					id: uniqueZones++
				}
				clicks.push(obj);
			}
			
			clickZones.data(clicks)();

			updatePopupText(clickZones, clickPopup, d);

			return monitor;
		}
		monitor.update = function(root) {
			clickZones();
			hoverZone();
			updatePopupText(clickZones, clickPopup, root);
			updatePopupText(hoverZone, hoverPopup, root);
			return monitor;
		}
		monitor.projection = function(p) {
			if (!arguments.length) {
				return projection;
			}
			projection = p;
			return monitor;
		}

		function checkInput(d) {
			var actions = input.getInput();

			while (actions.length) {
				switch (actions.pop()) {
					case SPACE_BAR_DOWN:
						var ndx = checkForClickedZone(loc);
						if (ndx >= 0) {
							var ri = radii.indexOf(clicks[ndx].r);
							ri = (ri+1)%radii.length;
							clicks[ndx].r = radii[ri];
							clickZones.data(clicks).transition()();
							updatePopupText(clickZones, clickPopup, d);
						}
						else {
							index = (index+1)%radii.length;
							radius = radii[index];
							hoverZone.data([{cx:loc[0], cy:loc[1], r:radius, id:0}]).transition();
						}
						break;
					case ESC_KEY_DOWN:
						clickZones.data(clicks = [])();
						updatePopupText(clickZones, clickPopup, d);
						break;
				}
			}
		}
		function updatePopupText(zone, popup, root) {
			var data = zone.getData(root),
				format = d3.format('>,'),
				text = [];

			data.forEach(function(d) {
				var table = [],
					coords = avlmap.formatLocation(projection.invert([d.data.cx, d.data.cy]), projection.scale()),
					header = [coords];
				header.tableHeader = true;
				header.span = 3;

				var rowHeader = ['Interstate', 'Segments', 'AADT'];
				rowHeader.rowHeader = true;

				table.push(header, rowHeader);

				var totalSegments = 0;
				for (var key in d.routes) {
					var aadt = d.routes[key].aadt/d.routes[key].segments;

					table.push(['I-'+key, d.routes[key].segments, aadt]);

					totalSegments += d.routes[key].segments;
				}
				var weightedAve = 0;
				for (var i = 2; i < table.length; i++) {
					weightedAve += table[i][2]*table[i][1]/totalSegments;
					table[i][2] = format(Math.round(table[i][2]));
				}
				if (table.length > 3) {
					table.push(['Summary', totalSegments, format(Math.round(weightedAve))]);
				}

				text.push(table);
			})

			popup
				.visible(text.length && text[0].length)
				.data(text)();
		}
		function checkForClickedZone(point) {
			for (var i = 0; i < clicks.length; i++) {
				var circle = objects.Circle(clicks[i].cx, clicks[i].cy, clicks[i].r);

				if (circle.containsPoint(point)) {
					return i;
				}
			}
			return -1;
		}

		return monitor;
	}

	this.interstates_map_overlay = overlay;
})()