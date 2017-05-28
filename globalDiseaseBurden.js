function gdbMain() {
    var DictFiles = ['ages', 'genders', 'locations', 'metrics', 'years'];
    var Dict = {};
    var DataFiles = ['allcountries'];
    /**
     * Data[0]: Country ID
     * Data[1]: Year
     * Data[2]: Age ID
     * Data[3]: Gender ID
     * Data[4]: Metric ID
     * Data[5]: Mean Percentage
     * @type {Array}
     */
    var Data = [];
    var Filters = {
        changed: true,
        ages: [36, 38],
        genders: [3],
        countries: [160],
        metrics: [1, 2]
    };

    $.when(
        $.getJSON(DictFiles[0] + '.json', function (data) {
            Dict[DictFiles[0]] = data;
        }),
        $.getJSON(DictFiles[1] + '.json', function (data) {
            Dict[DictFiles[1]] = data;
        }),
        $.getJSON(DictFiles[2] + '.json', function (data) {
            Dict[DictFiles[2]] = data;
        }),
        $.getJSON(DictFiles[3] + '.json', function (data) {
            Dict[DictFiles[3]] = data;
        }),
        $.getJSON(DictFiles[4] + '.json', function (data) {
            Dict[DictFiles[4]] = data;
        }),
        $.getJSON(DataFiles[0] + '.json', function (data) {
            Data = data;
        })
    )
        .done(function () {
            $(".loading").hide();
            gdbRun();
        })
        .fail(function (error) {
                console.log('Data load faled: ', error);
                $(".loading").addClass("error").text("An error occurred while loading the data: " + error);
            }
        )
    ;

    function gdbRun() {
        var w = 1024;
        var h = 450;
        var margins = {
            top: 80,
            bottom: 40,
            left: 60,
            right: 240
        };
        var width = w - margins.left - margins.right;
        var height = h - margins.top - margins.bottom;
        var chartTitle = "Disease Burden 1990 - 2013";

        var svg = d3.select(".content").append("svg")
            .attr("id", "chart")
            .attr("width", w)
            .attr("height", h);

        // Header
        var headerTextTranslate = 48
        svg.append("g")
            .append("text")
            .classed("header-text", true)
            .text( Dict.locations[Filters.countries[0]][1] + " " + chartTitle)
            .attr("transform", "translate(" + w / 2 + "," + headerTextTranslate + ")");

        var chart = svg.append("g")
            .classed("display", true)
            .attr("transform", "translate(" + margins.left + "," + margins.top + ")");

        var yearParser = d3.timeParse("%Y");

        // Need to filter the data first to determine extents for the Y axis
        var dataFilter = makeDataFilter();
        var filteredSet = dataFilter(Data);
        var cols = {
            'year': 0,
            'percent': 4
        };

        var xScale = d3.scaleTime()
            .domain(d3.extent(Dict.years, function (d) {
                return yearParser(d)
            }))
            .range([0, width]);
        var yScale = d3.scaleLinear()
            .domain(d3.extent([filteredSet.extents.min, filteredSet.extents.max]))
            .range([height, 0]);
        var xAxis = d3.axisBottom()
            .scale(xScale);
        var yAxis = d3.axisLeft()
            .scale(yScale)
            .tickFormat(d3.format(".0%"));
        var trendline = d3.line()
            .x(function (d) {
                var date = yearParser(d[cols.year])
                return xScale(date);
            })
            .y(function (d) {
                return yScale(d[cols.percent]);
            })
            .curve(d3.curveMonotoneX);
        var xGridlines = d3.axisBottom()
            .scale(xScale)
            .tickSize(height, height)
            .tickFormat("");
        var yGridlines = d3.axisLeft()
            .scale(yScale)
            .tickSize(-width, 0, 0)
            .tickFormat("");

        var plotSymbols = function (i) {
            return d3.symbol()
                .size(32)
                .type(d3.symbols[i % d3.symbols.length]);
        };
        var plotSymbolsLarger = function (i) {
            return d3.symbol()
                .size(96)
                .type(d3.symbols[i % d3.symbols.length]);
        };
        var plotColors = d3.scaleOrdinal(d3.schemeCategory10);

        setUpControls();
        plot.call(chart, {
            dataSet: filteredSet,
            initialize: true,
            update: false,
            axis: {
                x: xAxis,
                y: yAxis
            },
            gridlines: {
                x: xGridlines,
                y: yGridlines
            },
            trendline: trendline
        });


        /**
         * Set up controls
         */
        function setUpControls() {
            var controls = d3.select(".content")
                .append("div")
                .classed("controls", true)
                .append("span")
                .text("Select country ");

            var countryControl = controls.append("select")
                .classed("country-select", true);

            for (var i in Dict.locations) {
                var selected = false;
                if (Filters.countries.indexOf(+i) !== -1) {
                    selected = true;
                }
                countryControl.insert("option")
                    .attr("value", i)
                    .property("selected", selected)
                    .text(Dict.locations[i][1]);
            }
            countryControl.on("change", updateFilters);

            controls.append("span")
                .text(" Select gender ");
            var genderControl = controls.append("select")
                .classed("gender-select", true);

            for (var i in Dict.genders) {
                var selected = false;
                if (Filters.genders.indexOf(+i) !== -1) {
                    selected = true;
                }
                genderControl.insert("option")
                    .attr("value", i)
                    .property("selected", selected)
                    .text(Dict.genders[i]);
            }
            genderControl.on("change", updateFilters);
        }

        /**
         * Update filters
         */
        function updateFilters() {
            console.log("update filters and replot chart from " + this.className);
            if (this.className === "country-select") {
                Filters.countries = [+(this.value)];
                d3.select(".header-text")
                    .text( Dict.locations[Filters.countries[0]][1] + " " + chartTitle);
            }
            if (this.className === "gender-select") {
                Filters.genders = [+(this.value)];
            }

            Filters.changed = true;
            filteredSet = dataFilter(Data);
            yScale = d3.scaleLinear()
                .domain(d3.extent([filteredSet.extents.min, filteredSet.extents.max]))
                .range([height, 0]);
            plot.call(chart, {
                dataSet: filteredSet,
                initialize: false,
                update: true,
                axis: {
                    x: xAxis,
                    y: yAxis
                },
                gridlines: {
                    x: xGridlines,
                    y: yGridlines
                },
                trendline: trendline
            });
        }

        /**
         * Plot the chart
         * @param {Object} params
         */
        function plot(params) {
            drawDecorations.call(this, params);

            // PLOT DATA
            // enter()
            for (var iLine = 0; iLine < params.dataSet.data.length; iLine++) {
                this.selectAll(".trendline" + iLine)
                    .data([params.dataSet.data[iLine]])
                    .enter()
                    .append("path")
                    .style("stroke", function (d, i) {
                        return plotColors(iLine);
                    })
                    .attr("data-line", iLine)
                    .classed("trendline trendline" + iLine, true);

                this.selectAll(".point" + iLine)
                    .data(params.dataSet.data[iLine])
                    .enter()
                    .append("path")
                    .style("stroke", function (d, i) {
                        return plotColors(iLine);
                    })
                    .style("fill", function (d, i) {
                        return plotColors(iLine);
                    })
                    .classed("point point" + iLine, true)
                    .attr("data-line", iLine)
                    .attr("d", plotSymbols(iLine));
            }

            // update
            for (var i = 0; i < params.dataSet.data.length; i++) {
                this.selectAll(".trendline" + i)
                    .attr("d", function (d) {
                        return params.trendline(d);
                    })
                    .on("mouseover", function (d, i) {
                        highlightData(this);
                    })
                    .on("mouseout", function (d, i) {
                        highlightData(this);
                    });
                this.selectAll(".point" + i)
                    .attr("transform", function (d) {
                        return "translate(" + xScale(yearParser(d[cols.year])) + "," + yScale(d[cols.percent]) + ")"
                    })
                    .on("mouseover", function (d, i) {
                        highlightData(this);
                    })
                    .on("mouseout", function (d, i) {
                        highlightData(this);
                    })
                    .append("title")
                    .text(function (d) {
                        return d3.format(".1%")(d[cols.percent]);
                    });
                ;
            }

            // exit()
            for (vari = 0; iLine < params.dataSet.data.length; iLine++) {
                this.selectAll(".trendline" + iLine)
                    .data([params.dataSet.data[iLine]])
                    .exit()
                    .remove();
                this.selectAll(".point" + iLine)
                    .data(params.dataSet.data[iLine])
                    .exit()
                    .remove();
            }
        }

        /**
         * Draw chart decorations
         * @param params
         */
        function drawDecorations(params) {
            if (params.initialize) {
                var yAxisLabelTranslate = -38;
                var xAxisLabelTranslate = 32;

                this.append("g")
                    .call(params.gridlines.x)
                    .classed("gridline x", true)
                    .attr("transform", "translate(" + 0 + "," + 0 + ")");
                this.append("g")
                    .call(params.gridlines.y)
                    .classed("gridline y", true)
                    .attr("transform", "translate(" + 0 + "," + 0 + ")");
                this.append("g")
                    .classed("x axis", true)
                    .attr("transform", "translate(0," + height + ")")
                    .call(params.axis.x);
                this.append("g")
                    .classed("y axis", true)
                    .attr("transform", "translate(0,0)")
                    .call(params.axis.y);
                this.select(".y.axis")
                    .append("text")
                    .classed("y axis-label", true)
                    .attr("transform", "translate(" + yAxisLabelTranslate + "," + height / 2 + ") rotate(-90)")
                    .text("Percent (Median)");
                this.select(".x.axis")
                    .append("text")
                    .classed("x axis-label", true)
                    .attr("transform", "translate(" + width / 2 + "," + xAxisLabelTranslate + ")")
                    .text("Year");

                var legendPadding = {
                    top: 10,
                    bottom: 10,
                    left: 10,
                    right: 10
                }
                var legendMargins = {
                    top: 10,
                    bottom: 10,
                    left: 10,
                    right: 0
                };
                var legendLineLength = 50;
                var legendItemHeight = 32;
                var legendWidth = margins.right - legendPadding.left - legendPadding.right;
                var legendHeight = h - margins.top - margins.bottom - legendPadding.top - legendPadding.bottom;

                var legend = this.append("g")
                    .classed("legend", true)
                    .attr("transform", "translate(" + (width + legendPadding.left) + "," + legendPadding.top + ")");

                legend.append("rect")
                    .attr("width", legendWidth)
                    .attr("height", legendHeight);

                var nextLine = 24;
                legend.append("text")
                    .classed("header-text", true)
                    .attr("fill", "black")
                    .attr("transform", "translate(" + legendWidth / 2 + "," + nextLine + ")")
                    .text("Legend");

                for (var i = 0; i < params.dataSet.labels.length; i++) {
                    nextLine += legendItemHeight;
                    var legendItem = legend.append("g");

                    var fudgeTextHeight = 10;
                    legendItem.append("rect")
                        .attr("width", legendWidth - legendPadding.left - legendPadding.right)
                        .attr("height", legendItemHeight)
                        .attr("data-line", i)
                        .attr("transform", "translate(" + legendPadding.left + "," + (nextLine - fudgeTextHeight) + ")")
                        .classed("legend-item-box legend-item-box" + i, true)
                        .on("mouseover", function () {
                            highlightData(this);
                        })
                        .on("mouseout", function () {
                            highlightData(this);
                        });

                    legendItem.append("text")
                        .classed("legend-item-text", true)
                        .attr("fill", "black")
                        .attr("transform", "translate(" + (legendMargins.left + 3) + "," + nextLine + ")")
                        .text(params.dataSet.labels[i]);

                    legendItem.append("path")
                        .style("stroke", plotColors(i))
                        .style("fill", plotColors(i))
                        .classed("point legend-point legend-point" + i, true)
                        .attr("d", plotSymbols(i))
                        .attr("transform", "translate(" + legendWidth / 2 + "," + (nextLine + 15) + ")");

                    legendItem.append("line")
                        .style("stroke", plotColors(i))
                        .style("stroke-width", 3)
                        .classed("trendline legend-line legend-line" + i, true)
                        .attr("x1", 0)
                        .attr("x2", legendLineLength)
                        .attr("y", (nextLine + 15))
                        .attr("transform", "translate(" + (legendWidth / 2 - legendLineLength / 2) + "," + (nextLine + 15) + ")");

                }

            }
        }

        function highlightData(element) {
            var i = element.getAttribute("data-line");

            var points = '.point' + i;
            var trendlines = '.trendline' + i;
            var legendItem = '.legend-item-box' + i;
            var legendLine = '.legend-line' + i;
            $(points).toggleClass("highlight");
            $(trendlines).toggleClass("highlight");
            $(legendItem).toggleClass("highlight");
            $(legendLine).toggleClass("highlight");

            //debugger;

            // Counter-intuitive, but we just set the highlight if it needs it, so now resize the points appropriately
            if ($(legendItem).hasClass('highlight')) {
                d3.selectAll(points)
                    .transition()
                    .attr("d", plotSymbolsLarger(i));
            } else {
                d3.selectAll(points)
                    .transition()
                    .attr("d", plotSymbols(i));
            }
        }
    }


    /**
     * Returns a function that caches and returns a filtered subset of the Data
     * Currently makes a pass over the data for each combination of filters, which is inefficient, but good enough for
     * now.
     *
     * @returns {filterData}
     *
     * @todo Refactor data filter function, which is hardcoded to only load the first country ID
     */
    function makeDataFilter() {
        var dataSubset = {
                labels: [],
                data: [],
                extents: {
                    min: 0,
                    max: 0
                }
            };

        /**
         * Given a Data set, creates a subset, if necessary, which is cached in the closure, and returns it:
         * subset[0]: Year
         * subset[1]: Age ID
         * subset[2]: Gender ID
         * subset[3]: Metric ID
         * subset[4]: Mean Percentage
         *
         * @param Data
         * @returns {Object}
         *
         */
        function filterData(Data) {
            if (Filters.changed || dataSubset.data.length === 0) {
                dataSubset.labels = [];
                dataSubset.data = [];
                dataSubset.extents = undefined;
                for (var iAge = 0; iAge < Filters.ages.length; iAge++) {
                    for (var iGender = 0; iGender < Filters.genders.length; iGender++) {
                        for (var iMetric = 0; iMetric < Filters.metrics.length; iMetric++) {
                            var lineSubset = [];
                            for (var i = 0; i < Data.length; i++) {
                                if (Data[i][0] === Filters.countries[0] &&
                                    Data[i][2] === Filters.ages[iAge] &&
                                    Data[i][3] === Filters.genders[iGender] &&
                                    Data[i][4] === Filters.metrics[iMetric]) {
                                    lineSubset.push([Data[i][1], Data[i][2], Data[i][3], Data[i][4], Data[i][5]]);

                                    // Track extents for this subset
                                    if (dataSubset.extents === undefined) {
                                        dataSubset.extents = {
                                            'min': Data[i][5],
                                            'max': Data[i][5]
                                        };
                                    } else {
                                        if (dataSubset.extents.min > Data[i][5]) {
                                            dataSubset.extents.min = Data[i][5];
                                        }
                                        if (dataSubset.extents.max < Data[i][5]) {
                                            dataSubset.extents.max = Data[i][5];
                                        }
                                    }
                                }
                            }
                            dataSubset.data.push(lineSubset);
                            dataSubset.labels.push(
                                Dict.ages[Filters.ages[iAge]][0] + ", " +
                                Dict.genders[Filters.genders[iGender]] + ", " +
                                Dict.metrics[Filters.metrics[iMetric]]
                            )
                        }
                    }
                }
                Filters.changed = false;
            }

            return dataSubset;
        }

        return filterData;
    }
}

$(document).ready(gdbMain);