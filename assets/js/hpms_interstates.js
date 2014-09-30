(function() {
	var hpms = {};

	hpms.active = false;
	hpms.requests = [];
	hpms.name = 'hpms_interstates';
	hpms.updating = false;

	var margin = { top: 30 };

	var map,
		path,
		layer = null,
		layerData = [];

	var SVG,
		JSON;

	var activeInterstates = [];

	var XHRcache = {};

	var quadtree,
		quadtreeRoot;

	var monitor;

	var LOADING = 0;

	var stroke = d3.scale.quantile()
		.range(["#313695", "#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#fee090", "#fdae61", "#f46d43", "#d73027", "#a50026"]);

	hpms.init = function() {
		map = avlminimap.CanvasMap()
			.width(window.innerWidth)
			.height(window.innerHeight-margin.top)
			.clearColor('#99a');

		quadtree = d3.geom.quadtree()
			.extent([[0,0],[window.innerWidth, window.innerHeight-margin.top]]);
		quadtreeRoot = quadtree([]);

		voronoi = d3.geom.voronoi()
			.clipExtent([[0,0],[window.innerWidth,window.innerHeight-30]]);

		var mapDiv = d3.select('#hpms-interstates').call(map),
			canvas = mapDiv.selectAll('canvas'),
			context = canvas.node().getContext('2d');

		SVG = d3.select('#hpms-interstates').append('svg')
			.style('position', 'absolute')
			.style('display', 'block')
			.attr('width', window.innerWidth)
			.attr('height', window.innerHeight-margin.top)
			.datum(quadtreeRoot);

		targetGroup = SVG.append('g');

		monitor = interstates_map_overlay.MapMonitor()
			.projection(map.projection())
			.init(SVG);

		SVG.on('click', monitor.click)
			.on('mouseover', monitor.enter)
			.on('mousemove', monitor)
			.on('mouseout', monitor.exit);

		path = d3.geo.path()
			.projection(map.projection());

		layer = map.Layer()
			.styles({ strokeStyle: function(d) { return stroke(d.properties.aadt); },
					  lineWidth: 8 });

		d3.json('assets/data/us_states.json', function(error, data) {
			JSON = topojson.feature(data, data.objects.states);

			JSON.features = JSON.features
				.filter(function(d) {
					return d.id != 72 && d.id != 78 && d.id != 2 && d.id != 15;
				});

			d3.json('http://localhost:1337/hpms/interstates_by_state', function(error, data) {
				var domain = [];

				JSON.features.forEach(function(feat) {
					feat.properties.aadt = data[feat.id] || 0;
					domain.push(feat.properties.aadt);
				})

				var mean = domain.reduce(function(a,b) { return a + b/domain.length}, 0),
					variance = domain.reduce(function(a, b) {
						return a + Math.pow(b-mean, 2)/domain.length;
					}, 0),
					deviation = Math.pow(variance, 0.5);

				var fill = d3.scale.linear()
					.domain([mean-deviation*2, mean+deviation*2])
					.range(["#ccff88", "#001100"]);

				var baseLayer = map.Layer()
					.data([JSON])
					.styles({ fillStyle: function(d) { return fill(d.properties.aadt); },
								strokeStyle: '#000', lineWidth: 1,
							  	lineCap: 'round', lineJoin: 'round' });

				map.zoomToBounds(JSON)
					.append(baseLayer);

				map.append(layer);

				baseLayer.draw();
			})
		})
	}

	hpms.updateActiveInterstates = function(data, newInterstate) {
		var datum = data.datum;
		if (newInterstate) {
			activeInterstates.push(datum);
			addInterstate(datum);
		}
		else {
			esc.arrayRemove(activeInterstates, datum);
			removeInterstate(datum);
		}
	}

	function addInterstate(datum) {
		LOADING++;
		XHRcache[datum] = d3.json('http://localhost:1337/hpms/'+datum+'/interstate_geo', function(error, data) {
			delete XHRcache[datum];
			LOADING--;

			var json = topojson.feature(data, data.objects.geo);
			json.id = datum;

			json.features.sort(function(a, b) { return a.properties.aadt - b.properties.aadt; });

			json.features.forEach(function(feat) {
				var centroid = path.centroid(feat);
				centroid.circle = objects.Circle(centroid[0], centroid[1], 2);
				centroid.properties = feat.properties;

				feat.centroid = centroid;

				quadtreeRoot.add(centroid);
			})

			monitor.update(quadtreeRoot);

			layerData.push(json);

			calcStrokeDomain();

			layer.data(layerData)
				.draw();
		});
	}

	function calcStrokeDomain() {
		var domain = [];
		layerData.forEach(function(collection) {
			collection.features.forEach(function(feat) { domain.push(feat.properties.aadt); });
		});
		stroke.domain(domain);
	}

	function removeInterstate(datum) {
		if (datum in XHRcache) {
			XHRcache[datum].abort();
			delete XHRcache[datum];
			LOADING--;
			return;
		}

		layerData = layerData.filter(function(d) { return d.id != datum; });

		var data = [],
			domain = [];

		layerData.forEach(function(collection) {
			collection.features.forEach(function(feat) {
				data.push(feat.centroid);
				domain.push(feat.properties.aadt);
			})
		})
		quadtreeRoot = quadtree(data);

		stroke.domain(domain);

		SVG.datum(quadtreeRoot);

		monitor.update(quadtreeRoot);

		layer.data(layerData);

		map.draw();
	}

	this.hpms_interstates = hpms;
})()