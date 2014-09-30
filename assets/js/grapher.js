var Grapher = (function(){

	function StackGrapher() {
		var svg,
			graph,
			dataObj,
			margin = { top: 25, right: 25, bottom: 0, left: 75 },
			width = window.innerWidth,
			height = window.innerHeight,
			wdth,
		    hght,
		    mouseover = null,
		    mouseout = null,
		    click = null;

		function grapher() {
			var obj = dataObj(),
		    	data = dataObj.data();

		    var transition = graph.transition().duration(500);

		   	transition.select('.x-axis').call(dataObj.xAxis()).style('opacity',data.length);
		   	transition.select('.y-axis').call(dataObj.yAxis()).style('opacity', data.length);

		   	var stacks = graph.selectAll('.stack')
		   		.data(data, function(d) { return dataObj.key(d); });

		   	stacks.exit()
		   		.transition().duration(500)
		   		.each(function(d) {
		   			d3.select(this).selectAll('rect')
				   		.transition().duration(500)
				   		.attr('fill', '#fff')
				   		.attr('height', 0)
				   		.attr('y', hght);
		   		})
		   		.remove();

		   	stacks.enter().append('g')
		   		.attr('class', 'hpms-graph-stack')
		   		.attr('transform', dataObj.transform)
		   		.attr('class', 'stack');
		   		
		   	stacks.transition().duration(500)
		   		.attr('transform', dataObj.transform)
		   		.each(function(d) {
		   			var offset = 0;
		   			d.data.forEach(function(data) {
		   				data.offset = offset;
		   				offset += hght - obj.yScale(data);
		   			})
		   		});

		   	var bars = stacks.selectAll('rect')
		   		.data(function(d) { return d.data; }, function(d) { return d.type; });

		   	bars.exit()
		   		.transition().duration(500)
		   		.attr('height', 0)
		   		.attr('y', hght)
		   		.remove();

		   	bars.enter().append('rect')
		   		.attr('class', 'hpms-graph-rect')
		   		.attr('fill', '#fff')
		   		.attr('height', 0)
		   		.attr('x', 0)
		   		.attr('y', hght)
		        .on('mouseover', mouseover)
		        .on('mouseout', mouseout)
		        .on('click', click);

		   	bars.transition().duration(500)
		   		.attr('y', function(d) { return obj.yScale(d)-d.offset; })
		    	.attr('height', function(d) { return hght - obj.yScale(d); })
		        .attr('width', obj.barWidth)
		        .attr('fill', dataObj.color);

		   	if (data.length) {
			   	svg.style('display', 'block');
			}
			else {
				svg.transition().delay(500)
					.style('display', ',none');
			}
		}

		grapher.init = function(selection) {
			svg = selection.append('svg')
				.attr('class', 'hpms-bar-graph hpms-graph-svg')
				.style('width', width+'px')
				.style('height', height+'px');

			graph = svg.append('g')
				.attr("transform", "translate("+margin.left+", "+margin.top+")");

			margin.bottom = Math.max(50, height-500+30);

			wdth = width - margin.left - margin.right;
		    hght = height - margin.top - margin.bottom;

		    graph.append('g')
		    	.attr('class', 'x-axis')
		    	.style('opacity', 0)
		        .attr('transform', 'translate(0, '+(height - margin.top - margin.bottom)+')');
		   	
		    graph.append('g')
		    	.attr('class', 'y-axis')
		    	.style('opacity', 0);

		   	dataObj.init(wdth, hght);

		    return grapher;
		}
		grapher.dataObj = function(d) {
			if (!arguments.length) {
				return dataObj;
			}
			dataObj = d;
			return grapher;
		}
		grapher.makeSwitch = function() {
			svg.selectAll('g')
				.selectAll('rect')
				.transition().duration(250)
				.attr('y', hght)
				.attr('height', 0)
				.each('end', function() { grapher(); })
				.remove()
			return grapher;
		}
		grapher.width = function(w) {
			if (!arguments.length) {
				return width;
			}
			width = w;
			return grapher;
		}
		grapher.height = function(h) {
			if (!arguments.length) {
				return height;
			}
			height = h;
			return grapher;
		}

		grapher.onMouseover = function(cb) {
			if (!arguments.length) {
				return mouseover;
			}
			mouseover = cb;
			return grapher;
		}
		grapher.onMouseout = function(cb) {
			if (!arguments.length) {
				return mouseout;
			}
			mouseout = cb;
			return grapher;
		}
		grapher.onClick = function(cb) {
			if (!arguments.length) {
				return click;
			}
			click = cb;
			return grapher;
		}

		return grapher;
	}

	function LineGrapher() {
		var svg,
			graph,
			dataObj,
			margin = { top: 25, right: 25, bottom: 0, left: 75 },
			width = window.innerWidth,
			height = window.innerHeight,
			wdth,
			hght,
		    mouseover = null,
		    mouseout = null,
		    click = null,
		    voronoi,
		    voronoiGroup;

		function grapher() {
			var obj = dataObj(),
		    	data = dataObj.data();

		    var transition = graph.transition().duration(500);

		   	transition.select('.x-axis').call(dataObj.xAxis()).style('opacity',data.length);
		   	transition.select('.y-axis').call(dataObj.yAxis()).style('opacity', data.length);

			var line = d3.svg.line()
				.x(function(d, i) { return obj.xScale(d, i); })
				.y(function(d, i) { return obj.yScale(d, i) });

			var groups = graph.selectAll('.hpms-graph-group')
				.data(data, function(d) { return dataObj.key(d); })

			groups.exit().transition().duration(500)
				.each(function() {
					d3.select(this).selectAll('path')
						.transition().duration(500)
						.attr('d', function(d, i) {
							var xs = dataObj.xScale(),
								xd = xs.domain(),
								ys = dataObj.yScale(),
								yd = ys.domain();

							var l = '';

							d.forEach(function(d) {
								l += 'L'+xs(xd[0])+','+ys(yd[0]);
							})
							l = l.replace(/^L/, 'M');

							return l;
						})
				})
				.remove();

			groups.enter().append('g')
				.attr('class', 'hpms-graph-group');
				
			var lines = groups.selectAll('path')
				.data(function(d) { return [d.segments]; })

			lines.exit()
				.transition().duration(500)
				.attr('d', function(d, i) {
					var xs = dataObj.xScale(),
						xd = xs.domain(),
						ys = dataObj.yScale(),
						yd = ys.domain();

					var l = '';

					d.forEach(function(d) {
						l += 'L'+xs(xd[0])+','+ys(yd[0]);
					})
					l = l.replace(/^L/, 'M');

					return l;
				})
				.remove()

			lines.enter().append('path')
				.attr('class', 'hpms-graph-line')
				.attr('d', function(d, i) {
					var xs = dataObj.xScale(),
						xd = xs.domain(),
						ys = dataObj.yScale(),
						yd = ys.domain();

					var l = '';

					d.forEach(function(d) {
						l += 'L'+xs(xd[0])+','+ys(yd[0]);
					})
					l = l.replace(/^L/, 'M');

					return l;
				})
				.each(function(d) { d.line = this; })
				.on('mouseover', highlightPath)
				.on('mouseout', unhighlightPath);

			lines.transition().duration(500)
				.attr('d', line);
		}

		function highlightPath(data) {
			d3.select(this)
				.classed('hpms-line-highlight', true)
		}
		function unhighlightPath(d) {
			d3.select(this)
				.classed('hpms-line-highlight', false)
		}

		grapher.init = function(selection) {
			svg = selection.append('svg')
				.attr('class', 'hpms-graph-svg hpms-line-graph')
				.style('width', width+'px')
				.style('height', height+'px');

			graph = svg.append('g')
				.attr("transform", "translate("+margin.left+", "+margin.top+")");

			margin.bottom = Math.max(50, height-500+30);

			wdth = width - margin.left - margin.right;
		    hght = height - margin.top - margin.bottom;

		    graph.append('g')
		    	.attr('class', 'x-axis')
		    	.style('opacity', 0)
		        .attr('transform', 'translate(0, '+(height - margin.top - margin.bottom)+')');
		   	
		    graph.append('g')
		    	.attr('class', 'y-axis')
		    	.style('opacity', 0);

		   	dataObj.init(wdth, hght);
		   	return grapher;
		}
		grapher.dataObj = function(d) {
			if (!arguments.length) {
				return dataObj;
			}
			dataObj = d;
			return grapher;
		}
		// grapher.makeSwitch = function() {
		// 	svg.selectAll('g')
		// 		.selectAll('rect')
		// 		.transition().duration(250)
		// 		.attr('y', hght)
		// 		.attr('height', 0)
		// 		.each('end', function() { grapher(); })
		// 		.remove()
		// 	return grapher;
		// }
		grapher.width = function(w) {
			if (!arguments.length) {
				return width;
			}
			width = w;
			return grapher;
		}
		grapher.height = function(h) {
			if (!arguments.length) {
				return height;
			}
			height = h;
			return grapher;
		}

		grapher.onMouseover = function(cb) {
			if (!arguments.length) {
				return mouseover;
			}
			mouseover = cb;
			return grapher;
		}
		grapher.onMouseout = function(cb) {
			if (!arguments.length) {
				return mouseout;
			}
			mouseout = cb;
			return grapher;
		}
		grapher.onClick = function(cb) {
			if (!arguments.length) {
				return click;
			}
			click = cb;
			return grapher;
		}

		return grapher;
	}

	return {StackGrapher: StackGrapher, LineGrapher: LineGrapher};
})()