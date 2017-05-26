function gdbMain() {
    var DictFiles = ['ages', 'genders', 'locations', 'metrics', 'years'];
    var Dict = {};
    var DataFiles = ['afghanistan'];
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

    console.log('Initializing');
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
            }
        )
    ;

    function gdbRun() {
        // Set up chart area
        var w = 800;
        var h = 450;
        var margin = {
            top: 60,
            bottom: 80,
            left: 100,
            right: 80
        };
        var width = w - margin.left - margin.right;
        var height = h - margin.top - margin.bottom;
        var svg = d3.select("body").append("svg")
            .attr("id", "chart")
            .attr("width", w)
            .attr("height", h);
        var chart = svg.append("g")
            .classed("display", true)
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var yearParser = d3.timeParse("%Y");
        var yearFormat = d3.timeFormat("%Y");
        var x = d3.scaleTime()
            .domain(d3.extent(Dict.years, function (d) {
                return yearParser(d)
            }))
            .range([0, width]);
        var y = d3.scaleLinear()
            .domain(d3.extent(Data, function (d) {
                return d[5];
            }))
            .range([height, 0]);
        var xAxis = d3.axisBottom()
            .scale(x);
        var yAxis = d3.axisLeft()
            .scale(y)
            .tickFormat(d3.format(".0%"));
        var trendline = d3.line()
            .x(function (d) {
                var date = yearParser(d[0])
                return x(date);
            })
            .y(function (d) {
                return y(d[4]);
            })
            .curve(d3.curveMonotoneX);

        var dataFilter = makeDataFilter();

        plot.call(chart, {
            data: dataFilter(Data),
            axis: {
                x: xAxis,
                y: yAxis
            },
            trendline: trendline
        });

        /**
         * Plot the chart
         * @param {Object} params
         */
        function plot(params) {
            console.log("Plotting!");

            // AXiS
            this.append("g")
                .classed("x axis", true)
                .attr("transform", "translate(0," + height + ")")
                .call(params.axis.x);
            this.append("g")
                .classed("y axis", true)
                .attr("transform", "translate(0,0)")
                .call(params.axis.y);

            // PLOT DATA
            // enter()
            for (var iLine = 0; iLine < params.data.length; iLine++) {
                this.selectAll(".trendline" + iLine)
                    .data([params.data[iLine]])
                    .enter()
                    .append("path")
                    .classed("trendline trendline" + iLine, true);

                this.selectAll(".point" + iLine)
                    .data(params.data[iLine])
                    .enter()
                    .append("circle")
                    .classed("point point" + iLine, true)
                    .attr("r", 0)
                    .transition(1500)
                    .attr("r", 5)
                    .transition(1000)
                    .attr("r", 3);
            }

            // update
            for (var i = 0; i < params.data.length; i++) {
                this.selectAll(".trendline" + i)
                    .attr("d", function (d) {
                        return params.trendline(d);
                    });
                this.selectAll(".point" + i)
                    .attr("cx", function (d) {
                        var date = yearParser(d[0]);
                        return x(date);
                    })
                    .attr("cy", function (d) {
                        return y(d[4]);
                    });
            }

            // exit()
            for (vari = 0; iLine < params.data.length; iLine++) {
                this.selectAll(".trendline" + iLine)
                    .data([params.data[iLine]])
                    .exit()
                    .remove();
                this.selectAll(".point" + iLine)
                    .data(params.data[iLine])
                    .exit()
                    .remove();
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
     * @todo Refactor data filter function
     */
    function makeDataFilter() {
        var dataSubset = [],
            filtersChanged = false,
            filters = {
                ages: [36, 38],
                genders: [1, 2],
                metrics: [1, 2]
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
         * @returns {Array}
         *
         */
        function filterData(Data) {
            console.log("filtering data");
            if (filtersChanged || dataSubset.length === 0) {
                console.log("  creating new data subset");
                dataSubset = [];
                for (var iAge = 0; iAge < filters.ages.length; iAge++) {
                    for (var iGender = 0; iGender < filters.genders.length; iGender++) {
                        for (var iMetric = 0; iMetric < filters.metrics.length; iMetric++) {
                            var lineSubset = [];
                            for (var i = 0; i < Data.length; i++) {
                                if (Data[i][2] === filters.ages[iAge] &&
                                    Data[i][3] === filters.genders[iGender] &&
                                    Data[i][4] === filters.metrics[iMetric]) {
                                    lineSubset.push([Data[i][1], Data[i][2], Data[i][3], Data[i][4], Data[i][5]]);
                                }
                            }
                            dataSubset.push(lineSubset);
                        }
                    }
                }
                filtersChanged = false;
            }

            return dataSubset;
        }

        return filterData;
    }
}

$(document).ready(gdbMain);