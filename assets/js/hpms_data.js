(function() {
	var hpms = {};

	hpms.active = false;
	hpms.requests = [];
	hpms.name = 'hpms_data';
	hpms.updating = false;

	var hoverPopup,
		clickPopup;

	var xhrCache;

	var manager,
		statesData = [],
		interstatesData = [];

	hpms.init = function() {
		manager = DataManager().init();

		d3.select('#hpms-data')
			.on('click.toggle', manager)

		xhrCache = XHRcache();

		hoverPopup = avlmenu.Popup()
			.position('top-right')
			.visible(false)
			.init(d3.select('#hpms-data'));

		clickPopup = avlmenu.Popup()
			.position('bottom-right')
			.visible(false)
			.init(d3.select('#hpms-data'));
	}

	function infoText(d) {
		d3.event.stopPropagation();

		var text = clickPopup.data(),
			length = text.length;

		// filter data to check if an already clicked bar was clicked a second time
		text = text.filter(function(t) { return !(t[0][0] == esc.fips2state(d.state) && t[1][1] == d.type); });

		if (text.length == length) {
			if (text.length < 5) {
				text.push(popupText(d).pop());
			}
			else {
				text.shift();
				text = text.concat(popupText(d));
			}
		}

		clickPopup.visible(text.length).data(text)();
	}

	function popupText(d) {
		var table = [],
			header = [esc.fips2state(d.state)];

		header.tableHeader = true;
		header.span = 2;

		table.push(header, ['Type', d.type], ['AADT', d.aadt], ['Segments', d.segments]);

		return [table];
	}

	hpms.updateActiveStates = function(data, add) {
		if (add) {
			addState(data);
		}
		else {
			removeState(data.datum);
		}
	}
	hpms.updateActiveInterstates = function(data, add) {
		if (add) {
			addInterstate(data);
		}
		else {
			removeInterstate(data.datum);
		}
	}

	function addState(data) {
		var xhr = d3.json('http://localhost:1337/hpms/'+data.datum+'/state_data', function(error, response) {
			statesData.push(response);
			manager.updateStates(statesData);
		})
		xhrCache.add(xhr, data.datum);
	}
	function removeState(datum) {
		xhrCache.abort(datum);

		statesData = statesData.filter(function(d) { return d.state != datum; });
		manager.updateStates(statesData);
	}

	function addInterstate(data) {
		var xhr = d3.json('http://localhost:1337/hpms/'+data.datum+'/interstate_data', function(error, response) {
			interstatesData.push(response);
			manager.updateInterstates(interstatesData);
		})
		xhrCache.add(xhr, data.datum);
	}
	function removeInterstate(datum) {
		xhrCache.abort(datum);

		interstatesData = interstatesData.filter(function(d) { return d.interstate != datum; });
		manager.updateInterstates(interstatesData);
	}

	function DataManager() {
		var objects = {},
			activeObject = null,
			legend = avlmenu.Legend(),
			banner;

		function manager() {
			d3.event.stopPropagation();
			if (activeObject == objects.states) {
				objects.states.deactivate();
				legend.visible(false);
				activeObject = objects.interstates;
			}
			else {
				objects.interstates.deactivate();
				legend.visible(true);
				activeObject = objects.states;
			}
			activeObject.activate();
			banner.text(activeObject.currentView())();
			legend();
		}
		manager.init = function() {
			objects.states = StatesObject().init();
			objects.interstates = InterstatesObject().init();

			activeObject = objects.states;

			banner  = avlmenu.Banner()
				.init(d3.select('#hpms-data'))
				.text(activeObject.currentView)
				.awake(true)
				.left(195)
				.top(10)
				.on('click.hpms-data', function() {
					d3.event.stopPropagation();
					banner.text(activeObject.switchView())();
				});
			banner()

			legend.onSelect(activeObject.onSelect)
				.onDeselect(activeObject.onDeselect)
				.top('26px')
				.right('300px')
				.scale(activeObject.dataObj().colorScale())
				.labeler(activeObject.labeler)
				.init(d3.select('#hpms-data'));
			legend();

			activeObject.activate();

			return manager;
		}

		manager.updateStates = function(data) {
			objects.states(data);
		}
		manager.updateInterstates = function(data) {
			objects.interstates(data);
		}

		return manager;
	}
	function InterstatesObject() {
		var div,
			dataObj,
			atts = ['aadt'],
			grapher,
			filters = [],
			dataView = {
				aadt: 'Interstates by AADT Count'
			},
			index = 0;

		function object(data) {
			dataObj.data(data);
			grapher();
		}

		object.init = function() {
			div = d3.select('#hpms-data').append('div')
				.style('display', 'none');

			dataObj = DataObject.InterstatesDataObject();

			grapher = Grapher.LineGrapher()
				.width(window.innerWidth-370)
				.height(500)
				.dataObj(dataObj)
				.init(div);

			return object;
		}
		object.activate = function() {
			div.style('display', null);
		}
		object.deactivate = function() {
			div.style('display', 'none');
		}

		object.switchView = function() {
			return 'Interstates by AADT Count';
		}
		object.currentView = function() {
			return 'Interstates by AADT Count';
		}
		object.labeler = function(d, i) {
			return 'I-'+d;
		}
		object.dataObj = function() {
			return dataObj;
		}
		object.filters = function(f) {
			if (!arguments.length) {
				return filters;
			}
			filters = f;
			return object;
		}
		return object;
	}
	function StatesObject() {
		var div,
			dataObj,
			atts = ['segments', 'aadt'],
			grapher,
			filters = [],
			dataView = {
				aadt: 'Average AADT by Type',
				segments: 'Total Segments by Type'
			},
			index = 0;

		function object(data) {
			dataObj.data(data);
			grapher();
		}
		object.init = function() {
			div = d3.select('#hpms-data').append('div')
				.style('display', 'none');

			dataObj = DataObject.StatesDataObject()
				.attr(atts[index]);

			grapher = Grapher.StackGrapher()
				.width(window.innerWidth-370)
				.height(500)
				.dataObj(dataObj)
				.init(div)
				.onMouseover(function(d) { hoverPopup.visible(true).data(popupText(d))(); })
			    .onMouseout(function(d) { hoverPopup.visible(false)(); })
			    .onClick(infoText);
			return object;
		}
		object.activate = function() {
			div.style('display', null);
		}
		object.deactivate = function() {
			div.style('display', 'none');
		}

		object.switchView = function() {
			index = (index+1)%atts.length;
			dataObj.attr(atts[index]);
			grapher.makeSwitch();
			return dataView[atts[index]];
		}
		object.currentView = function() {
			return dataView[atts[index]];
		}
		object.labeler = function(d, i) {
			return 'Type '+d;
		}
		object.dataObj = function() {
			return dataObj;
		}
		object.filters = function(f) {
			if (!arguments.length) {
				return filters;
			}
			filters = f;
			return object;
		}

		object.onSelect = function(d) {
			d3.event.stopPropagation();
			filters.push(d.datum);
			dataObj.filters(filters);
			grapher();
		}
		object.onDeselect = function(d) {
			d3.event.stopPropagation();
			esc.arrayRemove(filters, d.datum);
			dataObj.filters(filters);
			grapher();
		}

		return object;
	}

	function XHRcache() {
		var XHRs = [],
			cache = d3.map();

		cache.add = function(xhr, id) {
			cache.set(id, xhr);
		}

		cache.abort = function(id) {
			if (cache.has(id)) {
				cache.get(id).abort();
				cache.remove(id);
			}
		}

		return cache;
	}

	this.hpms_data = hpms;
})()