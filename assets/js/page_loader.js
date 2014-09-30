function PageLoader() {
	var actions = new Object(null);

	function loader(page) {
		if (page.requests.length) {
			setTimeout(updatePage, 500, page);
		}
	}
	loader.init = function() {
		actions['statechange'] = [hpms_map, hpms_data];
		actions['interstatechange'] = [hpms_interstates, hpms_data];

		hpms_menu.register('statechange', stateChange);
		hpms_menu.register('interstatechange', interstateChange);

		return loader
	}

	function updatePage(page) {
		var request = page.requests.shift();
		page[request[0]](request[1], request[2]);
		if (page.requests.length && page.active) {
			setTimeout(updatePage, 500, page);
		}
	}

	function stateChange(data, add) {
		actions.statechange.forEach(function(page) {
			if (page.active) {
				page.updateActiveStates(data, add);
			}
			else {
				var request = ['updateActiveStates', data, add];
				checkRequests(page, request);
			}
		})
	}

	function interstateChange(data, add) {
		actions.interstatechange.forEach(function(page) {
			if (page.active && !page.requests.length) {
				page.updateActiveInterstates(data, add);
			}
			else {
				var request = ['updateActiveInterstates', data, add];
				checkRequests(page, request);
			}
		})
	}

	function checkRequests(page, request) {
		var indexes = [];
		for (var i = 0; i < page.requests.length; i++) {
			if (page.requests[i][0] == request[0] && page.requests[i][1].datum == request[1].datum && page.requests[i][2] == !request[2]) {
				indexes.push(i);
			}
		}
		if (!indexes.length) {
			page.requests.push(request);
		}
		else {
			while (indexes.length) {
				page.requests.splice(indexes.pop(), 1);
			}
		}
	}

	return loader;
}