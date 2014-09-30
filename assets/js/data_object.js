var DataObject = (function() {

	var COLORS = {
		3:  ["#fc8d59","#ffffbf","#91bfdb"].reverse(),
		4:  ["#d7191c","#fdae61","#abd9e9","#2c7bb6"].reverse(),
		5:  ["#d7191c","#fdae61","#ffffbf","#abd9e9","#2c7bb6"].reverse(),
		6:  ["#d73027","#fc8d59","#fee090","#e0f3f8","#91bfdb","#4575b4"].reverse(),
		7:  ["#d73027","#fc8d59","#fee090","#ffffbf","#e0f3f8","#91bfdb","#4575b4"].reverse(),
		8:  ["#d73027","#f46d43","#fdae61","#fee090","#e0f3f8","#abd9e9","#74add1","#4575b4"].reverse(),
		9:  ["#d73027","#f46d43","#fdae61","#fee090","#ffffbf","#e0f3f8","#abd9e9","#74add1","#4575b4"].reverse(),
		10: ["#a50026","#d73027","#f46d43","#fdae61","#fee090","#e0f3f8","#abd9e9","#74add1","#4575b4","#313695"].reverse(),
		11: ["#a50026","#d73027","#f46d43","#fdae61","#fee090","#ffffbf","#e0f3f8","#abd9e9","#74add1","#4575b4","#313695"].reverse()
	}

	function StatesDataObject() {
		var data,
			xScale,
			yScale,
			xAxis,
			yAxis,
			colorScale,
			wdth = 0,
			hght = 0,
			transform,
			attr,
			filters = [];

		function dataObj() {
			var Xticks = dataObj.Xticks(),
				Ymax = dataObj.maxY();

		   	var barWidth = Math.min((wdth-(data.length+1)*2) / data.length, wdth/15),
		   		space = wdth - (barWidth * data.length),
		   		gap = space / (data.length+1);

		   	var padding = (2*gap + barWidth) / (gap + barWidth);

		   	transform = function(i) { return 'translate(' + (i*(barWidth + gap) + gap) + ', 0)'; };

		    xScale.domain(Xticks)
		    	.rangePoints([0, wdth], padding);

		   	yScale.domain([0, Ymax]);

		   	data.forEach(function(d) {
		   		d.data.sort(function(a, b) { return b[attr]-a[attr]; });
		   	})

		   	var obj = new Object(null);

		   	obj.barWidth = barWidth;
		   	if (attr == 'aadt') {
		   		obj.yScale = function(d) { return yScale(d.aadt*d.segments/d.totalSegments); };
		   	}
		   	else {
		   		obj.yScale = function(d) { return yScale(d[attr]); };
		   	}

		   	return obj;
		}
		dataObj.attr = function(a) {
			if (!arguments.length) {
				return attr;
			}
			attr = a;
			return dataObj;
		}
		dataObj.init = function(w, h) {
			wdth = w;
			hght = h;

		    xScale = d3.scale.ordinal()
		    	.rangePoints([0, wdth]);
		    xAxis = d3.svg.axis()
		    		.scale(xScale)
		    		.orient('bottom');

		   	yScale = d3.scale.linear()
		   		.rangeRound([hght, 0])
		   		.clamp(true);
		    yAxis = d3.svg.axis()
		    		.scale(yScale)
		    		.orient('left');

		    colorScale = d3.scale.ordinal()
		   		.domain([1,2,3,4,5,6,7])
		   		.range(COLORS[7]);
		}
		dataObj.data = function(d) {
			if (!arguments.length) {
				return data;
			}
			data = d;
			applyFilters();
			return dataObj;
		}
		dataObj.xScale = function(x) {
			if (!arguments.length) {
				return xScale;
			}
			xScale = x;
			return dataObj;
		}
		dataObj.yScale = function(y) {
			if (!arguments.length) {
				yScale;
			}
			yScale = y;
			return dataObj;
		}
		dataObj.colorScale = function(c) {
			if (!arguments.length) {
				return colorScale;
			}
			colorScale = c;
			return dataObj;
		}
		dataObj.xAxis = function(x) {
			if (!arguments.length) {
				return xAxis;
			}
			xAxis = x;
			return dataObj;
		}
		dataObj.yAxis = function(y) {
			if (!arguments.length) {
				return yAxis;
			}
			yAxis = y;
			return dataObj;
		}
		dataObj.filters = function(f) {
			if (!arguments.length) {
				return filters;
			}
			filters = f;
			applyFilters();
			return dataObj;
		}

		dataObj.key = function(d, i) {
			return d.state;
		}
		dataObj.transform = function(d, i) {
			return transform(i);
		}
		dataObj.color = function(d, i) {
			return colorScale(d.type);
		}

		dataObj.Xticks = function() {
			return data.map(function(d) { return esc.fips2state(d.fips, true); });
		}
		dataObj.maxY = function() {
			if (attr == 'aadt') {
				var aadtValues = [];
				data.forEach(function(state) {
					var totalSegments = d3.sum(state.data.map(function(d) { return d.segments; }));

					var weightedAADTaverage = d3.sum(state.data.map(function (d) {
						d.totalSegments = totalSegments;
						return d.aadt * (d.segments/totalSegments)
					}));

					aadtValues.push(weightedAADTaverage)
				})
				return Math.round(d3.max(aadtValues));
			}
			return d3.max(data.map(function(d) { return d3.sum(d.data, function(d) { return d[attr]; }); }));
		}

		function applyFilters() {
			data.forEach(function(state) {
				if (!('savedData' in state)) {
					state.savedData = state.data;
				}
				state.data = state.savedData.filter(function(d) { return filters.indexOf(d.type) < 0; });
			});
		}

		return dataObj;
	}

	function InterstatesDataObject() {
		var data = [],
			xScale,
			yScale,
			xAxis,
			yAxis,
			colorScale,
			wdth = 0,
			hght = 0,
			transform,
			attr,
			filters = [];

		function dataObj() {
			data.forEach(function(d) {
				d.segments.sort(function(a, b) { return a.aadt-b.aadt; });
			})

		    xScale.domain(dataObj.xExtent());
		   	yScale.domain(dataObj.yExtent());
		   	var obj = new Object(null);
		   	
		   	obj.xScale = function(d, i) { return xScale(d.aadt); }
		   	obj.yScale = function(d) { return yScale(d.segments); };

		   	return obj;
		}
		dataObj.init = function(w, h) {
			wdth = w;
			hght = h;

		    xScale = d3.scale.linear()
		    	.rangeRound([0, wdth])
		   		.clamp(true);
		    xAxis = d3.svg.axis()
		    		.scale(xScale)
		    		.orient('bottom');

		   	yScale = d3.scale.linear()
		   		.rangeRound([hght, 0])
		   		.clamp(true);
		    yAxis = d3.svg.axis()
		    		.scale(yScale)
		    		.orient('left');
		}
		dataObj.data = function(d) {
			if (!arguments.length) {
				return data;
			}
			data = d;
			applyFilters();
			return dataObj;
		}
		dataObj.xScale = function(x) {
			if (!arguments.length) {
				return xScale;
			}
			xScale = x;
			return dataObj;
		}
		dataObj.yScale = function(y) {
			if (!arguments.length) {
				return yScale;
			}
			yScale = y;
			return dataObj;
		}
		// dataObj.colorScale = function(c) {
		// 	if (!arguments.length) {
		// 		return colorScale;
		// 	}
		// 	colorScale = c;
		// 	return dataObj;
		// }
		dataObj.xAxis = function(x) {
			if (!arguments.length) {
				return xAxis;
			}
			xAxis = x;
			return dataObj;
		}
		dataObj.yAxis = function(y) {
			if (!arguments.length) {
				return yAxis;
			}
			yAxis = y;
			return dataObj;
		}
		dataObj.xExtent = function() {
			return [d3.min(data.map(function(d) { return d3.min(d.segments.map(function(d) { return d.aadt; })); })) || 0,
			        d3.max(data.map(function(d) { return d3.max(d.segments.map(function(d) { return d.aadt; })); })) || 0];
		}
		dataObj.yExtent = function() {
			return [d3.min(data.map(function(d) { return d3.min(d.segments.map(function(d) { return d.segments; })); })) || 0,
			        d3.max(data.map(function(d) { return d3.max(d.segments.map(function(d) { return d.segments; })); })) || 0];
		}
		// dataObj.filters = function(f) {
		// 	if (!arguments.length) {
		// 		return filters;
		// 	}
		// 	filters = f;
		// 	applyFilters();
		// 	return dataObj;
		// }

		dataObj.key = function(d, i) {
			return d.interstate;
		}
		// dataObj.transform = function(d, i) {
		// 	return transform(i);
		// }
		// dataObj.color = function(d, i) {
		// 	return colorScale(d.type);
		// }

		function applyFilters() {
			return;
		}
		return dataObj;
	}

	return {StatesDataObject: StatesDataObject, InterstatesDataObject: InterstatesDataObject};
})()