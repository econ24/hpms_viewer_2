(function() {
	var obj = {};

	function MapZone(context, x, y, r) {
		var rect = objects.Rect(x-r, y-r, r*2, r*2),
			circle = objects.Circle(x, y, r),
			nodeRect = objects.Rect(0, 0, 0, 0),
			AADT = 0,
			AADTcount = 0,
			routes = {},
			canvasData = context.getImageData(x-r-2, y-r-2, r*2+4, r*2+4),
			projection = null,
			active = true,
			format = d3.format('>,');

		function zone() {
			canvasData = context.getImageData(x-r-2, y-r-2, r*2+4, r*2+4);
			context.fillStyle = 'rgba(255, 255, 255, 0.25)';
			context.lineWidth = 1;
			context.strokeStyle = 'rgba(255, 255, 255, 0.75)';
			context.beginPath();
			context.arc(x, y, r, 0, Math.PI*2);
			context.fill();
			context.stroke();
		}
		zone.updatePosition = function(mx, my) {
			x = mx;
			y = my;

			rect.center([x,y]);
			circle.center([x,y]);
			return zone;
		}
		zone.updateData = function(root) {
			AADT = 0;
			AADTcount = 0;
			routes = {};

			root.visit(travelTree);

			if (AADTcount) {
				AADT = Math.round(AADT/AADTcount);
			}

			return zone;
		}
		zone.getData = function() {
			if (!AADTcount) {
				return [];
			}
			var array = [];

			var tableHeader = [avlmap.formatLocation(projection.invert([x,y]), projection.scale())];
			tableHeader.tableHeader = true;
			tableHeader.span = 3;

			var rowHeader = ['Interstate', 'Segments', 'AADT'];
			rowHeader.rowHeader = true;

			array.push(tableHeader, rowHeader);

			for (var route in routes) {
				var row = [
						'I-'+route,
						format(routes[route].segments),
						format(Math.round(routes[route].aadt/routes[route].segments))
					];
				array.push(row);
			}
			if (array.length > 3) {
				array.push(['Summary', format(AADTcount), format(AADT)]);
			}

			return array;
		}
		zone.snapShot = function() {
			canvasData = context.getImageData(x-r-2, y-r-2, r*2+4, r*2+4);
			return zone;
		}
		zone.contains = function(point) {
			return circle.containsPoint(point);
		}
		zone.remove = function() {
			context.putImageData(canvasData, x-r-2, y-r-2);
			return zone;
		}
		zone.projection = function(p) {
			if (!arguments.length) {
				return projection;
			}
			projection = p;
			return zone;
		}
		zone.active = function(a) {
			if (!arguments.length) {
				return active;
			}
			active = a;
			return zone;
		}

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

			nodeRect
				.left(x1)
				.top(y1)
				.width(x2-x1)
				.height(y2-y1);

			return !rect.collideRect(nodeRect);
		}

		return zone;
	}

	obj.CanvasMapMonitor = function() {
		var data = [],
			hover = null,
			radii = [8, 16, 31],
			index = 1,
			radius = radii[index],
			hoverPopup = avlmenu.Popup()
				.position('top-right')
				.visible(false),
			clickPopup = avlmenu.Popup()
				.position('bottom-right')
				.visible(false),
			projection = null;

		function monitor(root) {
			var loc = d3.mouse(this);

			hover.remove()
				.updateData(root)
				.updatePosition(loc[0], loc[1]);

			var text = hover.getData();
			hoverPopup
				.data([text])
				.visible(text.length)();

			hover();
		}
		monitor.init = function(context, proj) {
			hover = MapZone(context, 0, 0, radius)
				.projection(proj);
			projection = proj;
			d3.select('#hpms-interstates').call(hoverPopup.init);
			d3.select('#hpms-interstates').call(clickPopup.init);
			return monitor;
		}
		monitor.enter = function() {
			var loc = d3.mouse(this);
			hover.updatePosition(loc[0], loc[1])();
			hover.active(true);
			return monitor;
		}
		monitor.click = function(root) {
			var loc = d3.mouse(this),
				context = this.getContext('2d');

			monitor.remove();

			var zone;
			if (!(zone = checkForClickedZone(loc))) {
				zone = MapZone(context, loc[0], loc[1], radius)
					.projection(projection);

				data.push(zone);
				zone.updateData(root)();
			}
			else {
				for (var i = data.length-1; i >= 0; i--) {
					data[i].remove();
				}
				esc.arrayRemove(data, zone);
				data.forEach(function(d) { d(); });
			}
			monitor.snapShot()
				.bind(this)(root);

			updateText();

			return monitor;
		}
		monitor.remove = function() {
			hover.remove()
				.active(false);
			return monitor;
		}
		monitor.update = function(root) {
			data.forEach(function(d) { d.updateData(root); });
			updateText();
			return monitor;
		}
		monitor.snapShot = function() {
			hover.snapShot();
			return monitor;
		}
		monitor.draw = function() {
			if (hover.active()) {
				hover();
			}
			data.forEach(function(d) { d(); });
			return monitor;
		}
		monitor.projection = function(p) {
			if (!arguments.length) {
				return projection;
			}
			projection = p;
			hover.projection(p);
			data.forEach(function(d) { d.projection(p); });
			return monitor;
		}

		function updateText() {
			var text = [];
			data.forEach(function(d) {
				text.push(d.getData());
			})
			clickPopup
				.visible(text.length && text[0].length)
				.data(text)();
		}
		function checkForClickedZone(point) {
			for (var i = 0; i < data.length; i++) {
				if (data[i].contains(point)) {
					return data[i];
				}
			}
			return null;
		}

		return monitor;
	}

	this.canvas_objects = obj;
})()