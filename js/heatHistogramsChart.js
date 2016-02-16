'use strict';
/**
 * ECMAScript6.
 * 
 * @author nevmerzhitsky
 */

/**
 * @constructor
 */
function heatHistogramsChart(options) {
    options = options || {};

    this.quantum = 1;

    this.margin = { top: 20, right: 60, bottom: 20, left: 20 };
    this.width = 1070;
    this.lineHeight = 30;
    this.labelWidth = 40;
    this.labelFontSize = 20;
    this.valueFontSize = 14;
    this.transitionsDuration = 1000;

    this.barsCount = 60;
    this.gradientStart = '#ddd';
    this.gradientFinish = 'darkgreen';

    this.rectMinWidth = 4;
    this.rectMaxMargin = 2;

    this.statMarkerWidth = 6;
    this.averagesColors = {
        median: 'orange',
        mean: 'red',
        quantile80: 'blue',
    };

    // Merging default and delivered params.
    for (var opt in options) {
        if ('_' === opt[0]) {
            continue;
        }

        this[opt] = options[opt];
    }

    this._data = new Map();
    this._histData = new Map();
    this._averages = new Map();
    this._countries = [];
    this._svg = null;
    this._rectWidth = Math.max(Math.floor(this.width / this.barsCount), 1);
    this._averagesCaptions = {
        median: 'Approximate median value',
        mean: 'Approximate 4/5 quantile value',
        quantile80: 'Mean value',
    };

    this._time = d3.scale.linear()
        .range([0, this.width])
        .clamp(true);
    this._timeAxis = d3.svg.axis()
        .scale(this._time)
        .orient('top')
        .tickFormat(this._formatTime);
    this._grad = d3.scale.linear()
        .range([this.gradientStart, this.gradientFinish])
        .clamp(true);
    this._valueScale = d3.scale.log()
        .range([this.rectMinWidth, this.lineHeight - this.rectMaxMargin])
        .clamp(true);
}

heatHistogramsChart.prototype._formatTime = function(v) {
    var time = new Date((new Date('2000-01-01T00:00:00')).getTime() + v * 1000);
    return moment(time).format('m[m] s[s]');
}

heatHistogramsChart.prototype.setData = function(data) {
    this._data = data;
    this._calcAverages();

    this._countries = Array.from(this._data.keys());
    this._svg = this._drawSkeleton();
}

heatHistogramsChart.prototype._calcAverages = function() {
    this._averages.clear();

    for (var country of this._data.keys()) {
        var values = this._data.get(country),
            times = this._fillArrayByValuesMap(values);

        this._averages.set(country, {
            median: d3.median(times),
            quantile80: d3.quantile(times, 0.8),
            mean: d3.mean(times),
        });
    }
}

heatHistogramsChart.prototype.getAverages = function() {
    return new Map(this._averages);
}

heatHistogramsChart.prototype._fillArrayByValuesMap = function(values) {
    var result = [];
    for (var time of values.keys()) {
        result.push([].fill.call({ length: values.get(time) }, time));
    }

    return d3.merge(result);
}

heatHistogramsChart.prototype.clear = function() {
    jQuery('#chart svg').remove();
}

heatHistogramsChart.prototype.render = function() {
    if (this._data.size == 0) {
        return;
    }

    var timeBoundaries = this._extentTimes();
    timeBoundaries[0] = 0;
    timeBoundaries[1] = this.barsCount * this.quantum;
    this._time.domain(timeBoundaries);

    this._svg.select('g.x.axis')
        .transition().delay(this.transitionsDuration / 2).duration(this.transitionsDuration / 2)
        .call(this._timeAxis);

    this._calcHistograms();
    var globalValueBoundaries = this._extentValues(this._histData);
    this._valueScale.domain([globalValueBoundaries[0], globalValueBoundaries[1]]);

    var rowNumber = 0;
    for (var country of this._countries) {
        this._drawRow(country, this._histData.get(country), rowNumber);
        rowNumber++;
    };
}

heatHistogramsChart.prototype._finishHeight = function() {
    var axisHeight = 26;
    // @TODO Finish.
    // axis = svg.select('g.x.axis').node().getBoundingClientRect().height;
    return axisHeight + this.lineHeight * this._data.size + this.margin.top + this.margin.bottom;
}

heatHistogramsChart.prototype._calcHistograms = function() {
    var chart = this,
        binsThresholds = Array.apply(null, {length: this.barsCount + 1}).map(Number.call, Number);
    binsThresholds = binsThresholds.map(function(v) { return v * chart.quantum; });
    binsThresholds[binsThresholds.length - 1] = (binsThresholds.length - 1) * this.quantum;

    this._histData.clear();
    // data is always grouped by seconds.
    for (var country of this._data.keys()) {
        this._histData.set(country, calcHistogram(this._data.get(country), binsThresholds));
    }
}

heatHistogramsChart.prototype.getHistograms = function() {
    return new Map(this._histData);
}

heatHistogramsChart.prototype._extentTimes = function() {
    var variants = [];

    for (var values of this._data.values()) {
        var times = Array.from(values.keys());
        variants.push(d3.extent(times));
    }

    variants = [].concat.apply([], variants);

    return d3.extent(variants);
}

heatHistogramsChart.prototype._extentValues = function(histograms) {
    var variants = [];

    for (var bins of histograms.values()) {
        variants.push(this._extentHistogram(bins));
    }
    variants = [].concat.apply([], variants);

    return d3.extent(variants);
}

heatHistogramsChart.prototype._extentHistogram = function(bins) {
    var times = Array.from(bins.keys()),
        timesExtent = d3.extent(times),
        variants = [];

    for (var time of times) {
        // Ignore last bin because it collect clamped data.
        if (time == timesExtent[1]) {
            continue;
        }
        if (bins.get(time) == 0) {
            continue;
        }

        variants.push(bins.get(time));
    }

    return d3.extent(variants);
}

heatHistogramsChart.prototype._drawSkeleton = function() {
    this.clear();

    var svg = d3.select('#chart').append('svg')
        .attr('width', this.width + this.margin.left + this.margin.right)
        .attr('height', this._finishHeight())
        .append('g')
        .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate('+ this.labelWidth +',0)');

    var dataStub = this._fillArrayByValuesMap(new Map([[0, this.barsCount]]));
    var rowNumber = 0;
    for (var country of this._countries) {
        var g = svg.append('g')
            .attr('class', 'journal')
            .attr('data-country', country);

        g.append('text')
            .attr('class', 'label')
            .attr('text-anchor', 'bottom')
            .attr('x', 0)
            .attr('y', rowNumber * this.lineHeight + this.lineHeight - 1)
            .attr('font-family', 'monospace')
            .style('font-size', this.labelFontSize +'px')
            .text(country)
            .on('mouseover', function(p) {
                var g = d3.select(this).node().parentNode;
                d3.select(g).selectAll('rect.count').style('display', 'none');
                d3.select(g).selectAll('text.value').style('display', 'block');
                d3.select(g).selectAll('rect.stats').style('display', 'none');
            })
            .on('mouseout', function(p) {
                var g = d3.select(this).node().parentNode;
                d3.select(g).selectAll('rect.count').style('display', 'block');
                d3.select(g).selectAll('text.value').style('display', 'none');
                d3.select(g).selectAll('rect.stats').style('display', 'block');
            });

        var rects = g.selectAll('rect.count')
            .data(dataStub)
            .enter()
                .append('rect')
                .attr('class', 'count')
                .attr('height', 0)
                .style('fill', this.gradientStart)
                .append('title');

        var text = g.selectAll('text.value')
            .data(dataStub)
            .enter()
                .append('text')
                .attr('class', 'value')
                .attr('text-anchor', 'middle')
                .style('display', 'none');

        jQuery.each(this.averagesColors, function(name, color) {
            if (typeof color === 'undefined' || ! color) {
                return;
            }

            g.append('rect')
                .attr('class', 'stats')
                .attr('data-type', name)
                .attr('visibility', false)
                .attr('x', 0)
                .attr('fill', color)
                .append('title');
        });

        rowNumber++;
    };

    return svg;
}

heatHistogramsChart.prototype._drawRow = function(country, bins, rowNumber) {
    var binsArray = Array.from(bins);
    var valueBoundaries = this._extentHistogram(bins);
    this._grad.domain(valueBoundaries);

    // Create object of functions for simple binding.
    var funcs = {
        mustHide(d) { return d[1] == 0; },

        valueScaleWithZero(d) { return d[1] > 0 ? this._valueScale(d[1]) : 0; },
        rectX(d) { return this.labelWidth + this._time(d[0]); },
        rectY(d) { return rowNumber * this.lineHeight + (this.lineHeight - funcs.valueScaleWithZero(d)); },
        rectFill(d) { return this._grad(d[1]); },
        rectTitle(d) {
            var time = this._formatTime(d[0]);
            if (this._time.domain()[1] == d[0] + this.quantum) {
                time += ' and more';
            }
            return 'EXE time: '+ time +'\nCount: '+ d[1];
        },

        textX(d) { return this.labelWidth + this._time(d[0]) + this._rectWidth / 2; },
        textY(d) { return rowNumber * this.lineHeight + this.lineHeight / 2 + this.valueFontSize / 2 - 2; },

        drawStatLineWrapper(name, color) { this._drawStatLine(g, name, this._averages.get(country), rowNumber); },
    }
    bindAll(funcs, this);

    var g = this._svg.select('g[data-country="'+ country +'"]');

    var rects = g.selectAll('rect.count')
            .data(binsArray),
        rectTitles = g.selectAll('rect.count title')
            .data(binsArray),
        text = g.selectAll('text.value')
            .data(binsArray);

    rects
        .classed('must_hide', funcs.mustHide)
        .attr('x', funcs.rectX)
        .attr('width', this._rectWidth)
        .transition().duration(this.transitionsDuration)
            .attr('y', funcs.rectY)
            .attr('height', funcs.valueScaleWithZero)
            .style('fill', funcs.rectFill);
    rectTitles
        .text(funcs.rectTitle);

    text
        .classed('must_hide', funcs.mustHide)
        .attr('x', funcs.textX)
        .attr('y', funcs.textY)
        .attr('transform', function(d) { return 'rotate(-45 '+ funcs.textX(d) +','+ funcs.textY(d) +')'; })
        .style('font-size', this.valueFontSize +'px')
        .text(function(d){ return d[1]; });

    jQuery.each(this.averagesColors, funcs.drawStatLineWrapper);
}

heatHistogramsChart.prototype._drawStatLine = function(g, name, averages, rowNumber) {
    var chart = this;
    var timeValue = averages[name],
        color = this.averagesColors[name],
        hintPrefix = this._averagesCaptions[name],
        x = this.labelWidth + this._time(timeValue) - this.statMarkerWidth / 2,
        y = rowNumber * this.lineHeight + 1;

    if (typeof color === 'undefined' || ! color) {
        return;
    }

    var line = g.select('rect.stats[data-type="'+ name +'"]');
    line
        .classed('must_hide', function(d) { return averages[name] > chart._time.domain()[1]; })
        .attr('y', y)
        .attr('width', this.statMarkerWidth)
        .attr('height', this.lineHeight - 1)
        .transition().delay(this.transitionsDuration / 2).duration(this.transitionsDuration / 2)
            .attr('x', x);
    line.select('title')
        .text(hintPrefix +': '+ this._formatTime(timeValue.toFixed(0)));
}
