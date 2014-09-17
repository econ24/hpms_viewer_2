(function(port) {
	var hpms = {};

	var map,
		layerCache = {},
		AADTvalues = [],
		activeStates = [],
		renderedTypes = 0,
		margin = { top: 30 },
		width,
		height;

	var popup,
		floater,
		legend;

	var TYPES_PER_ZOOM = [0,0,0,0,1,1,1,1,2,2,3,3,4,4,7];

	var strokeWidth = d3.scale.ordinal()
		.domain([1,2,3,4,5,6,7])
		.range([5,4,3,2,2,2,2])

	var stroke = d3.scale.quantile()
		.range(["#313695", "#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#fee090", "#fdae61", "#f46d43", "#d73027", "#a50026"]);

    var format = d3.format('>,.0f');

	hpms.init = function() {
		map = avlmap.Map({id:'#hpms-map', minZoom: 4})
			.addControl({type:'info', position:'top-right'});

		map.onZoom(mapZoomWatch);

		var dims = map.dimensions();

		width = dims[0];
		height = dims[1];

		popup = avlmenu.Popup()
			.position('bottom-right')
			.activation('manual')
			.bounds(d3.select('#hpms-map'))

		d3.select('#hpms-map')
			.on('click', function() {
				clickedRoute = null;
				popup.visible(false)();
			})

		floater = avlmenu.Popup()
			.position('floater')
			.bounds(d3.select('#hpms-map'))
			.activation('mouseover')
			.text(function(d) { 
				if (d.properties.route) {
					return [
						['Route', d.properties.route],
						['AADT', d.properties.aadt],
						['Type', d.properties.type]
					];
				}
				return [
					['AADT', d.properties.aadt],
					['Type', d.properties.type]
				]; 
			});

		legend = d3.select('#hpms-map')
			.append('div')
			.attr('id', 'hpms-map-legend-container');

		legend
			.append('div')
			.attr('id', 'hpms-map-legend');

		var menubar = avlmenu.Menubar();

		var tabs = avlmenu.Tab()
			.on('click', drawGraphs)
			.data([{ text: 'Map Tab', id: '#hpms-map' }, { text: 'Graphs Tab', id: '#hpms-graphs' }]);

		d3.select('#hpms-menubar').call(menubar);

		var url = "http://api.tiles.mapbox.com/v3/am3081.map-lkbhqenw/{z}/{x}/{y}.png";

		map.addLayer(avlmap.RasterLayer({url: url}));

	    d3.json("http://localhost:"+port+"/hpms", function(error, data) {
			var dropdown = avlmenu.Dropdown()
				.data([{ text: 'HPMS Menu' }]);

			menubar.append(dropdown);

			var toggles = avlmenu.Toggle()
				.multi(true);

        	data.sort(function(a, b) {
        		if (a.table_name < b.table_name) {
        			return -1;
        		}
        		else if (a.table_name > b.table_name) {
        			return 1;
        		}
        		return 0;
        	})

        	var toggleData = [];

        	for (var i = 0; i < data.length; i++) {
        		var obj = {
        			text: formatName(data[i].table_name),
        			datum: data[i].table_name,
					select: selectedState,
					deselect: unselectedState
        		}
        		toggleData.push(obj);
            }

            toggles.data(toggleData);

            dropdown.append(toggles);

			menubar.append(tabs);
        });

		function mapZoomWatch() {
			var types = TYPES_PER_ZOOM[map.zoom()];

			if (types != renderedTypes) {
				calcStrokeDomain();
			}
			renderedTypes = types;
		}
	}

    function formatName(name) {
        var regex = /(\d+)/;
        name = name.replace(regex, ' ' + '$1');

        regex = /(new|south|west|north|rhode)/;
        name = name.replace(regex, '$1' + ' ');

        return esc.capitalizeAll(name);
    }

	function selectedState(data) {
    	var layer = checkCache(data);

    	activeStates.push(data.datum);

    	calcStrokeDomain();

    	transition(legend, {opacity: 1});

    	map.addLayer(layer);
	}

	function unselectedState(data){
    	var layer = checkCache(data);

    	map.removeLayer(layer);

    	remove(activeStates, data.datum);

    	if (activeStates.length) {
    		calcStrokeDomain();
    	}
    	else {
    		transition(legend, {opacity: 0});
    	}
	}

	function transition(selection, style, duration) {
		selection
			.transition()
			.duration(duration || 500)
			.style(style);
	}

	function checkCache(data) {
		var state = data.datum
		if (!(state in layerCache)) {
			layerCache[state] = createNewLayer(data);
		}
		return layerCache[state];
	}

	function createNewLayer(data) {
		var url = "http://localhost:8000/" + data.datum + "/{z}/{x}/{y}.json";

		var layer = avlmap.VectorLayer({url: url, name: data.name});
		layer.minAADT = data.min_aadt;
		layer.maxAADT = data.max_aadt;
		layer.drawTile = drawTile;

		return layer;
	}

	function calcStrokeDomain() {
	    d3.json("http://localhost:"+port+"/hpms/aadt")
	        .post(JSON.stringify({states: activeStates, types: TYPES_PER_ZOOM[map.zoom()]}), function(error, data) {
	        	stroke.domain(data);

    			colorPaths();

    			generateLabels();
	        })
	}

	function colorPaths(filter) {
	    d3.selectAll('.avl-tile')
	    	.selectAll('path')
	    	.style('stroke', function(d) { return stroke(d.properties.aadt); })
	}

	function generateLabels() {
		var labels = d3.select('#hpms-map-legend')
			.selectAll('div')
			.data(stroke.range());

		labels.enter().append('div')
			.attr('class', 'hpms-map-legend-label');

		labels
			.style('background-color', function(d) { return d; })
			.text(function(d) {
				return format(stroke.invertExtent(d)[0]);
			})

		var colorRange = stroke.range(),
			color = colorRange[colorRange.length-1];

		var lastLabel = d3.select('#hpms-map-legend')
			.selectAll('.last-label')
			.data([color]);

		lastLabel.enter().append('div')
			.attr('class', 'hpms-map-legend-label last-label');

		lastLabel
			.text(format(stroke.invertExtent(color)[1]))
			.style('background-color', color);

		var w = legend.style('width', ((stroke.range().length+1)*legend.selectAll('.hpms-map-legend-label').node().offsetWidth)+'px');
	}

	function remove(array, element) {
		for (var i = 0; i < array.length; i++) {
			if (array[i] === element)  {
				array.splice(i, 1);
				return true;
			}
		}
		return false;
	}

	var mouseoverSelection = null;

	function drawTile(group, json, tilePath) {
      	group.selectAll("path")
          	.data(json.features.sort(function(a, b) {
          		return b.properties.type - a.properties.type;
          	}))
			.enter().append("path")
			.attr('class', function(d) {
				if (d.properties.route) {
					if (checkMajorInterstate(d)) {
						return 'avl-path '+'route-'+d.properties.route+'-'+d.properties.type;
					}
					return 'avl-path '+'route-'+d.properties.route+'-'+d.properties.type+'-'+d.properties.state;
				}
				return 'avl-path';
			})
			.style('stroke-width', function(d) { return strokeWidth(d.properties.type); })
			.style('stroke', function(d) { return stroke(d.properties.aadt); })
			.attr("d", tilePath)
			.on('mouseover', function(d) {
				if (d.properties.route) {
					if (checkMajorInterstate(d)) {
						mouseoverSelection = d3.selectAll('.route-'+d.properties.route+'-'+d.properties.type)
							.style('stroke-width', 10);
					}
					else {
						mouseoverSelection = d3.selectAll('.route-'+d.properties.route+'-'+d.properties.type+'-'+d.properties.state)
							.style('stroke-width', 10);
					}
				}
				else {
					mouseoverSelection = null;
				}
			})
			.on('mouseout', function(d) {
				if (mouseoverSelection !== null) {
					mouseoverSelection
						.style('stroke-width', function(d) { return strokeWidth(d.properties.type); })
					mouseoverSelection = null;
				}
			})
			.on('click', showRouteData)
			.call(floater);
    }

    var clickedRoute = null;

    var textOrder = {
    	Route: 0,
    	AADT: 1,
    	Type: 2,
    	Segments: 3,
    	State: 4,
    	States: 4
    }

    function checkMajorInterstate(r) {
    	// only check interstate type 1s with a route number of the form: x0 or x5
    	return +r.properties.type === 1 && (+r.properties.route%5) === 0 && 100-(+r.properties.route) > 0;
    }

    function showRouteData(r) {
    	d3.event.stopPropagation();

    	if (r.properties.route) {
    		var clicked,
    			url;

			if (checkMajorInterstate(r)) {
				clicked = 'route-'+r.properties.route+'-'+r.properties.type;
			}
			else {
				clicked = 'route-'+r.properties.route+'-'+r.properties.type+'-'+r.properties.state;
			}

			if (clicked == clickedRoute) {
				clickedRoute = null;
				popup.visible(false)();
				return;
			}
			clickedRoute = clicked;

			url = 'http://localhost:'+port+'/hpms/'+r.properties.route;

    		if (checkMajorInterstate(r)) {
    			url += '/interstate_data';
    		}
    		else {
    			url += '/'+r.properties.type+
					   '/'+r.properties.state+
					   '/intrastate_data';
    		}

		    d3.json(url)
		        .post(JSON.stringify({states: activeStates, types: TYPES_PER_ZOOM[map.zoom()]}), function(error, data) {

		        	data.Segments = format(data.Segments);
		        	data.AADT = format(data.AADT);

		        	if (data.States) {
		        		data.States = data.States
		        			.map(function(d) { return esc.fips2state(d, true); })
		        			.join(', ');
		        	}
		        	else {
		        		data.State = esc.fips2state(data.State, true);
		        	}

		        	var textData = [];
		        	for (var key in data) {
		        		textData.push([key, data[key]]);
		        	}
		        	textData.sort(function(a, b) {
		        		return textOrder[a[0]] - textOrder[b[0]];
		        	})

		    		popup
		    			.text(textData)
		    			.visible(true)();
		        })
    	}
    }

    function drawGraphs(d) {
    	if (d.id != '#hpms-graphs') {
    		return;
    	}
    	console.log(d);
    }

	this.hpms = hpms;
})(1337)