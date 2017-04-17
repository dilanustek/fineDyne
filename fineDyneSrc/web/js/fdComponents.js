var allData;
var groupname = "marker-select";
var xf;

var priceDimension;
var restaurantNamesDimension;
var starsDimension;
var categoriesDimension;

var priceBar;
var marker;
var starBar;
var categoriesBar;
var dataTable;


function resetCharts() {
		marker.filterAll();
		starBar.filterAll();
		priceBar.filterAll();
		categoriesBar.filterAll();

		dc.redrawAll(groupname);
}


d3.csv("italian_indian.csv", function(data) {
		allData = data;
    drawMarkerSelect(allData);
});

function drawMarkerSelect(data) {
    xf = crossfilter(data);

// Prices bar graph
		priceDimension = xf.dimension(function(d) {
				return d.price_range;
		});

		var priceGroup = priceDimension.group().reduceCount();

		priceBar = dc.barChart(".container .priceBar",groupname)
			          .dimension(priceDimension)
			          .group(priceGroup)
			          .width(300)
			          .height(200)
			          .renderLabel(false)
								.x(d3.scale.ordinal())
	          			.xUnits(dc.units.ordinal)
								.brushOn(true)
								.on('renderlet.barclicker', function(chart, filter){
    								chart.selectAll('rect.bar').on('click.custom', function(d) {
        						console.log(d);
    								});
								})
								.ordinalColors(['#28c619'])
                 .yAxisLabel("# of restaurants");

		priceBar.xAxis().tickFormat(function (v) {
									var resultStr = '';
									for(i=0; i<v; i++){
										resultStr +='$';
									}
									return resultStr;
								});

		priceBar.yAxis().ticks(4);


// Map
	restaurantNamesDimension  = xf.dimension(function(d) {
			return d.name;
	});

  var restaurantsGroup = restaurantNamesDimension.group().reduce(
			function(p, v) { // add
					p.name = v.name;
					p.price_range = v.price_range;
					p.stars = v.stars;
					p.latitude = v.latitude;
					p.longitude = v.longitude;
	        ++p.count;
	        return p;
	    		},
	    		function(p, v) { // remove
	        	--p.count;
	        	return p;
	    		},
	    		function() { // init
	        	return {count: 0};
	    		}
			);

		marker = dc_leaflet.markerChart(".container .inRowOppositeSides .map", groupname) //map formatting
          .dimension(restaurantNamesDimension)
          .group(restaurantsGroup)
          .width(700) //was 600
          .height(500)
          .center([43.733372, -79.354782]) //was 42.69,25.42
          .zoom(11) //was 7s
          .cluster(true) //was true
					.valueAccessor(function(kv) {
			         return kv.value.count;
			    })
			    .locationAccessor(function(kv) {
						return [kv.value.latitude,kv.value.longitude]	;
			    })
          .popup(function(kv,marker) {
              return kv.value.name + " - " + kv.value.stars + " * - "  + kv.value.price_range + "$";
          });



// Stars bar graph
		starsDimension = xf.dimension(function(d) {
							return d.stars;
						});
		var starsGroup = starsDimension.group().reduceCount();

		starBar = dc.barChart(".container .starBar",groupname)
		          .dimension(starsDimension)
		          .group(starsGroup)
		          .width(300)
		          .height(200)
		          .renderLabel(false)
							.x(d3.scale.ordinal())
              .xUnits(dc.units.ordinal)
							.brushOn(true)
							.on('renderlet.barclicker', function(chart, filter){
									chart.selectAll('rect.bar').on('click.custom', function(d) {
									console.log(d);
									});
							})
							.ordinalColors(['#fce91e'])
              .yAxisLabel("# of restaurants");

			starBar.yAxis().ticks(4);


// Categories bar graph
		categoriesDimension = xf.dimension(function(d) {
												return d.cuisine;
											});
	 	var categoriesGroup = categoriesDimension.group().reduceCount();

		categoriesBar = dc.rowChart(".container .categoriesBar",groupname)
												.dimension(categoriesDimension)
												.group(categoriesGroup)
												.width(300)
												.height(200)
												.renderLabel(true)
												//.x(d3.scale.ordinal())
												//		.xUnits(dc.units.ordinal)
												//		.elasticX(true)
									//	.barPadding(0.02)
									//  .outerPadding(0.01)
										 // .elasticY(true)
												//.x(d3.scale.linear().domain([1,5]))
												//.x(d3.scale.ordinal().rangeRoundBands([0, 400], 0.1))
												// .ordering(function (p) {
												//     return -p.value; //was -p.value
												// })
												//.brushOn(true)
												/*.on('renderlet.barclicker', function(chart, filter){
				    								chart.selectAll('rect.bar').on('click.custom', function(d) {
				        						console.log(d);
				    								});
												})*/;

			categoriesBar.xAxis().ticks(4);

// Data table
      // var tableGroup = restaurantNamesDimension.group().reduce(
      //     function(p, v) { // add
      //         p.name = v.name;
      //         p.price_range = v.price_range;
      //         p.stars = v.stars;
      //         p.latitude = v.latitude;
      //         p.longitude = v.longitude;
      //         return p;
      //         },
      //         function(p, v) { // remove
      //           return p;
      //         },
      //         function() { // init
      //           return;
      //         }
      //     );

        datatable = dc.dataTable(".container .dataTable", groupname)
                        .dimension(restaurantNamesDimension)
                        .group(function(d) { return "List of restaurants"})
                        // dynamic columns creation using an array of closures
                        .columns([
                          function(d) {console.log(d); return d.name;  },
                          function(d) { return d.stars;  },
                          function(d) { return d.price_range;  },
                          function(d) { return d.neighborhood;  },
                        ])
                        .size(20);


      dc.renderAll(groupname);
      return {marker: marker, priceBar:priceBar, starBar: starBar};
}
