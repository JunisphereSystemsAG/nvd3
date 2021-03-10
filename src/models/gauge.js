nv.models.gauge = function() {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var margin = {top: 0, right: 0, bottom: 0, left: 0}
        , width = 500
        , height = 500
        , id = Math.floor(Math.random() * 10000) //Create semi-unique ID in case user doesn't select one
        , color = nv.utils.getColor("#dee0e2")
        , valueFormat = d3.format(',.2f')
        , minMaxFormat = undefined
        , title = false
        , showMinMaxLabels = false
        , min = 0
        , max = 100
        , dispatch = d3.dispatch('chartClick', 'renderEnd', 'elementMousemove', 'elementMouseover', 'elementMouseout', 'renderEnd')
        , duration = 1000
        , rangeValid = true
        ;


    //============================================================
    // chart function
    //------------------------------------------------------------

    var renderWatch = nv.utils.renderWatch(dispatch);

    function chart(selection) {
        renderWatch.reset();
        selection.each(function(data) {
            var availableWidth = width - margin.left - margin.right
                , availableHeight = height - margin.top - margin.bottom
                , container = d3.select(this)
                ;

            var cx = availableWidth / 2;
            var cy = availableHeight / 2;

            nv.utils.initSVG(container);

            var radius = Math.min(availableWidth, availableHeight) / 2;

            var ranges = data[0].ranges || [];

            var normalizedMin = min || 0;
            var normalizedMax = max || 1;

            var rangeValid = max > min;

            var range = normalizedMax - normalizedMin;

            minMaxFormat = minMaxFormat || valueFormat;

            var fontSize = Math.round(Math.min(availableWidth, availableHeight) / 10);

            var zones = []

            if (rangeValid && ranges && ranges.length > 0){
                var lowerRanges = ranges.filter(function(r){return r.y >= normalizedMin})
                var upperRanges = ranges.filter(function(r){return r.y0 <= normalizedMax})

                for(var i = 0, il=lowerRanges.length; i<il; i++){
                  var range = lowerRanges[i];
                  zones.push({id: range.label, from: (i > 0 ? lowerRanges[i - 1].y : normalizedMin), to: range.y, color: range.color});
                }

                zones.push({id: "ok", from: (lowerRanges.length > 0 ? lowerRanges[lowerRanges.length - 1].y : normalizedMin), to: (upperRanges.length > 0 ? upperRanges[0].y0 : max), color: nv.utils.getColor(color || "#75cc04")});

                for(var i = 0, il=upperRanges.length; i<il; i++){
                  var range = upperRanges[i];
                  zones.push({id: range.label, from: range.y0, to: (i < il - 1 ? upperRanges[i + 1].y0 : normalizedMax), color: range.color});
                }
            } else {
                zones.push({id: "ok", from: normalizedMin, to: normalizedMax, color: color});
            }

            // Setup containers and skeleton of chart
            var wrap = container.selectAll('.nv-wrap.nv-gauge').data(data);
            var wrapEnter = wrap.enter().append('g').attr('class','nvd3 nv-wrap nv-gauge nv-chart-' + id);
            var gEnter = wrapEnter.append('g');
            var g_bands = gEnter.append('g').attr('class', 'nv-gaugeBands');
            var g_title = gEnter.append('g').attr('class', 'nv-gaugeTitle');
            var g_needle = gEnter.append('g').attr('class', 'nv-gaugeNeedle');
            var g_label = gEnter.append('g').attr('class', 'nv-gaugeLabel');
            var g_minLabel = gEnter.append('g').attr('class', 'nv-gaugeMinLabel');
            var g_maxLabel = gEnter.append('g').attr('class', 'nv-gaugeMaxLabel');

            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            var gaugeBandData = zones.map(function(zone, i){
                return {
                    id: zone.id,
                    from: zone.from,
                    to: zone.to,
                    color: zone.color,
                    min: normalizedMin,
                    max: normalizedMax
                };
            });

            var gaugeArc = d3.svg.arc()
                .startAngle(function(d){return valueToRadians(d.from, d.min, d.max)})
                .endAngle(function(d){return valueToRadians(d.to, d.min, d.max)})
                .innerRadius(function(d){return 0.65 * radius})
                .outerRadius(function(d){return 0.85 * radius});

            g_bands.selectAll(".nv-gaugeBands path").data(gaugeBandData, function(d){return d.id}).enter().append("path")
                    .style("fill", function(d){return d.color;})
                    .attr("class", "band")
                    .attr("d", gaugeArc);

            wrap.selectAll(".nv-gaugeBands path").data(gaugeBandData, function(d){return d.id}).transition().duration(duration)
                    .style("fill", function(d){return d.color;})
                    .attr("d", gaugeArc);

            // draw needle

            var needleData = [[{x: -0.8 * radius, y: 0}, {x: 0, y: 0}]];

            var needleLine = d3.svg.line()
                .x(function(d) { return d.x; })
                .y(function(d) { return d.y; })

            g_needle.selectAll(".nv-gaugeNeedle path").data(needleData).enter().append("path")
                .data(needleData)
                .attr("class", "needle")
                .attr("d", needleLine)
                .attr("stroke", "#262a2f")
                .attr("stroke-width", function(d){return radius * 0.04})
                .attr("transform", function(d){
                    var dv = data[0].value;

                    if(dv < normalizedMin){
                        dv = normalizedMin - (normalizedMax - normalizedMin) * 0.02;
                    } else if(dv > normalizedMax){
                        dv = normalizedMax + (normalizedMax - normalizedMin) * 0.02
                    }

                    return "rotate(" + valueToDegrees(dv, normalizedMin, normalizedMax) + ")"
                });

            wrap.selectAll(".nv-gaugeNeedle path").data(needleData).transition().duration(duration)
                .attr("d", needleLine)
                .attr("stroke-width", function(d){return radius * 0.04})
                .attr("transform", function(d){
                    var dv = data[0].value;

                    if(dv < normalizedMin){
                        dv = normalizedMin - (normalizedMax - normalizedMin) * 0.02;
                    } else if (dv > normalizedMax) {
                        dv = normalizedMax + (normalizedMax - normalizedMin) * 0.02
                    }

                    return "rotate(" + valueToDegrees(dv, normalizedMin, normalizedMax) + ")"
                });


            g_needle.selectAll(".nv-gaugeNeedle circle").data(needleData).enter().append('circle')
                .attr("class", "needle")
                .attr("fill", "#262a2f")
                .attr('cx', 0)
                .attr('cy', 0)
                .attr('r', function(d){return 0.1 * radius});

            wrap.selectAll(".nv-gaugeNeedle circle").data(needleData).transition().duration(duration)
                .attr('r', function(d){return 0.1 * radius});

            wrap.selectAll('.nv-gaugeBands path')
                .attr("transform", function () { return "translate(" + cx + ", " + (cy - 0.08 * radius) + ") rotate(270)" });

            wrap.select('.nv-gaugeNeedle')
                .attr('transform', 'translate(' + cx + ',' + (cy - 0.08 * radius) + ')');

            wrap.select('.nv-gaugeTitle')
                .attr('transform', 'translate(' + cx + ',' + (cy / 2 + fontSize / 2) + ')');

            wrap.select('.nv-gaugeLabel')
                .attr('transform', 'translate(' + cx + ',' + (cy + radius / 2 - fontSize * 0.9) + ')');

            if (showMinMaxLabels && rangeValid) {
                wrap.select('.nv-gaugeMinLabel')
                    .attr('transform', 'translate(' + (cx - radius / 1.65) + ',' + (cy + radius / 1.35 - fontSize * 0.8) + ')');

                wrap.select('.nv-gaugeMaxLabel')
                    .attr('transform', 'translate(' + (cx + radius / 1.65) + ',' + (cy + radius / 1.35 - fontSize * 0.8) + ')');
            }

            // draw title
            if (title) {
                g_title.append("text")
                    .attr("dy", fontSize / 2)
                    .attr("text-anchor", "middle")
                    .text(title)
                    .style("font-size", fontSize + "px");
            }

            var labelData = [data[0].value];

            // draw value
            g_label.selectAll(".nv-gaugeLabel text").data(labelData).enter().append("text")
                .attr("dy", function(){return fontSize / 2})
                .attr("text-anchor", "middle")
                .text(valueFormat)
                .style("font-size", function(d){return ((Math.min(availableHeight, availableWidth)) * 0.7 / (Math.max(valueFormat(d).length, 3) + 2)) + "px"; });

            wrap.selectAll(".nv-gaugeLabel text").data(labelData).transition().duration(duration)
                .attr("dy", function(){return fontSize / 2})
                .text(valueFormat)
                .style("font-size", function(d){return ((Math.min(availableHeight, availableWidth)) * 0.7 / (Math.max(valueFormat(d).length, 3) + 2)) + "px"; });

            if (showMinMaxLabels && rangeValid) {
                g_minLabel.selectAll(".nv-gaugeMinLabel text").data([normalizedMin]).enter().append("text")
                    .attr("dy", fontSize / 2)
                    .attr("text-anchor", "middle")
                    .text(minMaxFormat(normalizedMin))
                    .style("font-size", fontSize*0.7 + "px");

                wrap.select('.nv-gaugeMinLabel text').data([normalizedMin]).transition().duration(duration)
                    .attr("dy", fontSize / 2)
                    .text(minMaxFormat(normalizedMin))
                    .style("font-size", fontSize*0.7 + "px");

                g_maxLabel.selectAll(".nv-gaugeMaxLabel text").data([normalizedMax]).enter().append("text")
                    .attr("dy", fontSize / 2)
                    .attr("text-anchor", "middle")
                    .text(minMaxFormat(max))
                    .style("font-size", fontSize*0.7 + "px");

                wrap.select('.nv-gaugeMaxLabel text').data([normalizedMax]).transition().duration(duration)
                    .attr("dy", fontSize / 2)
                    .text(minMaxFormat(normalizedMax))
                    .style("font-size", fontSize*0.7 + "px");
            }

            container.on('click', function(d,i) {
                dispatch.chartClick({
                    data: d,
                    index: i,
                    pos: d3.event,
                    id: id
                });
            });

            wrapEnter.on('mouseover', function(d,i){
                dispatch.elementMouseover({data: d});
            })
            .on('mouseout', function(d,i){
                dispatch.elementMouseout({data: d})
            })
            .on('mousemove', function(d,i){
                dispatch.elementMousemove({data: d});
            });

            function valueToDegrees(value, min, max) {
                range = max - min;
                return value / range * 270 - (min / range * 270 + 45);
            }

            function valueToRadians(value, min, max) {
                return valueToDegrees(value, min, max) * Math.PI / 180;
            }

            function valueToPoint(value, factor, min, max, radius) {
                return {
                    x: cx - radius * factor * Math.cos(valueToRadians(value, min, max)),
                    y: cy - radius * factor * Math.sin(valueToRadians(value, min, max))
                };
            }
        });

        renderWatch.renderEnd('gauge immediate');
        return chart;
    }

    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    chart.dispatch = dispatch;
    chart.options = nv.utils.optionsFunc.bind(chart);

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        width:      {get: function(){return width;}, set: function(_){width=_;}},
        height:     {get: function(){return height;}, set: function(_){height=_;}},
        title:      {get: function(){return title;}, set: function(_){title=_;}},
        showMinMaxLabels:    {get: function(){return showMinMaxLabels;}, set: function(_){showMinMaxLabels=_;}},
        valueFormat:    {get: function(){return valueFormat;}, set: function(_){valueFormat=_;}},
        minMaxFormat:    {get: function(){return minMaxFormat;}, set: function(_){minMaxFormat=_;}},
        id:         {get: function(){return id;}, set: function(_){id=_;}},
        min:         {get: function(){return min;}, set: function(_){min=_;}},
        max:         {get: function(){return max;}, set: function(_){max=_;}},

        // options that require extra logic in the setter
        margin: {get: function(){return margin;}, set: function(_){
            margin.top    = typeof _.top    != 'undefined' ? _.top    : margin.top;
            margin.right  = typeof _.right  != 'undefined' ? _.right  : margin.right;
            margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
            margin.left   = typeof _.left   != 'undefined' ? _.left   : margin.left;
        }},
        color: {get: function(){return color;}, set: function(_){
            color=nv.utils.getColor(_);
        }}
    });

    nv.utils.initOptions(chart);
    return chart;
};
