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

var pinned = [];

var map;
var restaurantsGroup;

var randomImageArray = [
"https://i.ytimg.com/vi/NCO36DCleZ8/hqdefault.jpg",
"http://i.telegraph.co.uk/multimedia/archive/02999/restaurant_2999753b.jpg",
"https://images.pexels.com/photos/2232/vegetables-italian-pizza-restaurant.jpg?h=350&auto=compress&cs=tinysrgb",
"http://willtravelforfood.com/wp-content/uploads/2016/10/atma-indian-restaurant-montreal.jpg",
"https://media-cdn.tripadvisor.com/media/photo-s/0a/81/96/03/steak-and-lobster.jpg",
"http://img.aws.livestrongcdn.com/ls-slideshow-main-image/ds-photo/getty/article/94/18/637233918.jpg",
"http://s3.amazonaws.com/btoimage/prism-thumbnails/articles/bestofrankedlistings/hong-shing-chinese-restaurant-toronto-2e76110d.jpg-resize_then_crop-_frame_bg_color_FFF-h_480-gravity_center-q_70-preserve_ratio_true-w_720_.jpg",
"http://www.avenuecalgary.com/images/cache/cache_e/cache_1/cache_b/BEST_Restaurant_pics9-92b13b1e.jpeg?ver=1488381227&aspectratio=1.6666666666667",
"http://www.palkirestaurant.com/wp-content/uploads/2012/06/6kb80VApHMcQij-640m.jpg"
];


function zoomCluster(zoom){
		if (zoom < 18)
			return 40;
		else if (zoom < 25)
			return 0;
}
function resetCharts() {
		marker.filterAll();
		starBar.filterAll();
		priceBar.filterAll();
		categoriesBar.filterAll();

		dc.redrawAll(groupname);
}

function pinRestaurant (business_id, name, price_range, stars, cuisine) {
		// put in set of pinned elements so you don't pin it again
		if (pinned[business_id] == true) return;
		else pinned[business_id] = true;
		console.log(pinned)

		var randomImage = randomImageArray[Math.floor(Math.random() * randomImageArray.length)];

		var dollarSigns = "";
		for(i=0; i<price_range; i++){
			dollarSigns +='$';
		}

		var itemHtml = "<div class=\"inRow\" id=\"" + business_id + "\" style=\"width:600px; height:80px; border:1px solid #b3b3b3; margin-bottom:8px;\">"
					+ "<img src=\"" + randomImage + "\" width=\"70px\" style=\"margin-left:10px; margin-right:10px;\">"
					+ "<div class=\"inColumn\""
					+ "<p><b>" + name + "</b></p>"
					+ "<p>" + stars + " * "
					+ dollarSigns + "  "
					+ cuisine + "</p>"
					+ "</div>"
					+ "<div style=\"margin-left:auto;\"  onmouseover=\"this.style.background='#decdcd';\" "
					+ "onmouseout=\"this.style.background='white';\"  onclick=\" unpinRestaurant(\'" + business_id + "\'); \"  \"> <img src=\"close.svg\" >" + "</div>"
					+ "</div>";

		// there was nothing before so replace old html
		if (Object.keys(pinned).length == 1) {
			$("#pinnedItems").html( itemHtml );
		} else { // add to the top of the pinned list
			$("#pinnedItems").prepend( itemHtml );
		}

}

function unpinRestaurant (business_id) {
	//$("#pinnedItems").remove("#" + business_id );
	$("#" + business_id).remove();
	delete pinned[business_id];
	console.log(pinned);

	if (Object.keys(pinned).length == 0) {
		$("#pinnedItems").html( "	<p> Pin items on the map and from the list on the right to keep track of them here!</p>" );
	}

}


d3.csv("april_20_so_far.csv", function(data) {
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
    								});
								})
								.ordinalColors(['#28c619'])
                .yAxisLabel("# of restaurants")
								.elasticY(true);


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

  restaurantsGroup = restaurantNamesDimension.group().reduce(
			function(p, v) { // add
					p.name = v.name;
					p.price_range = v.price_range;
					p.stars = v.stars;
					p.latitude = v.latitude;
					p.longitude = v.longitude;
					p.business_id = v.business_id;
					p.cuisine = v.cuisine;
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

		marker = dc_leaflet.markerChart(".container .inRowOppositeSides .map", groupname)
          .dimension(restaurantNamesDimension)
          .group(restaurantsGroup)
          .width(600)
          .height(500)
          .center([43.733372, -79.354782])
          .zoom(11)
          .cluster(true)
					.clusterOptions({
						disableClusteringAtZoom: 15,
						spiderfyOnMaxZoom: false
					})
					.mapOptions({
						riseOnHover: true
					})
					.valueAccessor(function(kv) {
			         return kv.value.count;
			    })
			    .locationAccessor(function(kv) {
						return [kv.value.latitude,kv.value.longitude]	;
			    })
          .filterByArea(true)
          .popup(function(kv,marker) {
              var returnStr;

              returnStr = kv.value.name + " <br>" + kv.value.stars + " * <br> ";

              for(i=0; i<kv.value.price_range ; i++){
                returnStr +='$';
              }

							returnStr += " <br>" +  kv.value.cuisine + " <br>";

              returnStr +="<br>"
              returnStr += "<button type=\"btn\" onclick=\"pinRestaurant(\'"
												+ kv.value.business_id + "\',\'" + kv.value.name + "\',"
												+ kv.value.price_range + "," + kv.value.stars + ",\'"
												+ kv.value.cuisine + "\')\" >Pin</button>"
              return returnStr;
          });


          setTimeout(function(){
            map = marker.map();

            var group = new L.featureGroup(restaurantsGroup);
            var bounds = group.getBounds();
          //   map.fitBounds(bounds);
            // var bounds = L.latLngBounds(restaurantsGroup);
            // map.fitBounds(bounds);
          }, 500);
          //var group = new L.featureGroup([marker1, marker2, marker3]);
           //map.fitBounds(group.getBounds());
          // var bounds = L.latLngBounds(restaurantsGroup);
          // map.fitBounds(bounds);


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
									});
							})
							.ordinalColors(['#fce91e'])
              .yAxisLabel("# of restaurants", 30)
							.elasticY(true);

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
												.height(400)
												.renderLabel(true)
												.elasticX(true);

			categoriesBar.xAxis().ticks(4);


// Data table

        datatable = dc.dataTable(".container .table", groupname)
                        .dimension(restaurantNamesDimension)
                        .group(function(d) { return "";})  //TODO: get rid of this somehow.
                        .columns([
													{
														label: "Pinned",
														format: function(d){
															return " <img class=\"pin\" src=\"pin.png\" width=\"20px\" onclick=\"pinRestaurant(\'"
																				+ d.business_id + "\',\'" + d.name + "\',"
																				+ d.price_range + "," + d.stars + ",\'"
																				+ d.cuisine + "\'); \"  > "
								 								}
													},
                          {
                              label: "Name",
                              format: function(d){
																return d.name }
                          },
                          {
                              label: "Quality",
                              format: function (d) { return d.stars}

                          }
                          ,
                          {
                              label: "Price Range",
                              format: function (d) {
                                  var returnStr = "";
                                  for(i=0; i<d.price_range ; i++){
                                    returnStr +='$';
                                  }
                                  return returnStr;
                                }
                          },
                          {
                              label: "Cuisine",
                              format: function(d){return d.cuisine}
                          }
                        ])
                        .size(20);


      dc.renderAll(groupname);



/*
			var dataDim = xf.dimension(function(d) {return d.name;});
			datatable = dc.dataTable(".container .table", groupname)
												 .dimension(dataDim)
												 .group(function(d) { return "";})  //TODO: get rid of this somehow.
												 .columns([
													 {
														 function(d){
															 return " <img class=\"pin\" src=\"pin.png\" width=\"20px\" onclick=\"pinRestaurant(\'"
																				 + d.business_id + "\',\'" + d.name + "\',"
																				 + d.price_range + "," + d.stars + ",\'"
																				 + d.cuisine + "\'); \"  > "
																 }
													 },
													 {
															 function(d){
																 return d.name }
													 },
													 {
															 function (d) { return d.stars}

													 }
													 ,
													 {
															 function (d) {
																	 var returnStr = "";
																	 for(i=0; i<d.price_range ; i++){
																		 returnStr +='$';
																	 }
																	 return returnStr;
																 }
													 },
													 {
															 function(d){return d.cuisine}
													 }
												 ])
												 .size(20);

												 $('#data-table').on('click', '.data-table-col', function() {
												   var column = $(this).attr("data-col");
												   dataDim.dispose();
												   dataDim = xf.dimension(function(d) {return d[column];});
												   dataTable.dimension(dataDim)
												   dataTable.sortBy(function(d) {
												     return d[column];
												   });
												   dataTable.redraw();
												 });

*/


		$(".dc-table-row").click(function(e){
					$(this).find('.pin')[0].onclick();
					$(this).find('.pin').toggle();
		});


	/*	$(".dc-table-row").hover(function() {
			    $(this).find('.pin').show();
		}, function() {
			    $(this).find('.pin').hide();
		});*/
}
