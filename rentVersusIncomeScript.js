/*
To do:
Animation between years?
Add sortable table below -- city, income, rent (1 bed, 2 bed, etc...), rent to income ratio %, # households
Other formatting
US city data on a separate chart?

US
Need to fix coefficient for linear trendline -- currently printing Canadian value --
separate regression function call for each of CAN and US?
Chart change function -- 1 bed vs 2 bed
Pick different & new chart data labels -- change based on filter for region / size?
Remove mouse on when filtered out -- so that it's easier to hover over highlighted bubbles
Formatting for Population Filter column -- header, and select menu border color
Button for "Color Code by Region" -- if checked, show each region group in a different colour -- and add legend at the top left
*/


//inputs for both charts
//array which will hold the data as JSON objects -- one object per city

var chartHeight;
var chartWidth;
var margin;
var width;
var height;


//US chart inputs
var USjsonArray = [];
var USsvg;

var USRegionFocusMenu = document.getElementById("USRegionFocusMenu");
var userInputArray = document.getElementsByClassName("USFilterRegionInput");

var USPopulationSizeMenu = document.getElementById("USPopulationSizeMenu");
var userInputArray2 = document.getElementsByClassName("USPopulationSizeInput");

var USApartmentSizeMenu = document.getElementById("USApartmentSizeMenu");
var userInputArray3 = document.getElementsByClassName("USApartmentSizeInput");

var USdataString = "";
var UStitleString = "";

var USRegionFocusValue = "";
var USPopulationSizeValue = "";
var USApartmentSizeValue = "";

var USPopulationMediumMin = 500000;
var USPopulationLargeMin = 1500000;

var USx;
var USy;

var USxScaleMin = 3000;
var USxScaleMax1 = 11000;
var USxScaleMax2 = 7500;

//use this to scale y-axis min and max domain, depending on the user selection for # of bedrooms
var USyScaleMin = 600;
var USyScaleMax1 = 3700;
var USyScaleMax2 = 2000;



var UStooltipDiv;
var USequationDiv;

var USnumRows = 80;

var USselectedXValues = [];
var USselectedYValues = [];

var USMCoefficient = 0;
var USBCoefficient = 0;

var USlinearRegressionOutputs = {};

var USdotColour = "#CC1887";
var USdotHighlightColour = "#FF009D";
var USdotFadeColour = "gray";


//Canadian chart inputs
var jsonArray = [];
var svg;

var regionFocusMenu = document.getElementById("regionFocusMenu");
var userInputArray4 = document.getElementsByClassName("filterRegionInput");

var apartmentSizeMenu = document.getElementById("apartmentSizeMenu");
var userInputArray5 = document.getElementsByClassName("apartmentSizeInput");

var dataString = "";
var titleString = "";

var regionFocusValue = "";
var apartmentSizeValue = "";

var xScaleMin = 3000;
var xScaleMax = 7500;

//use this to scale y-axis min and max domain, depending on the user selection for # of bedrooms
var yScaleMin = 400;
var yScaleMax1 = 2000;
var yScaleMax2 = 2400;

var x;
var y;

var tooltipDiv;
var equationDiv;

var numRows = 34;

var selectedXValues = [];
var selectedYValues = [];

var CANMCoefficient = 0;
var CANBCoefficient = 0;

var linearRegressionOutputs = {};

var dotColour = "#79d6c1";
var dotHighlightColour = "#0EFFC7";
var dotFadeColour = "gray";




//main method
addEventListeners();
getUserInputs();

setupUSChartSkeleton();
initializeUSChart();

setupCANChartSkeleton();
initializeCANChart();

//event listeners for user input menus
function addEventListeners(){
    console.log("add event listeners");


    for(i=0; i<userInputArray.length; i++){
        userInputArray[i].addEventListener("change", filterUSChart);
    }

    for(i=0; i<userInputArray2.length; i++){
        userInputArray2[i].addEventListener("change", filterUSChart);
    }

    for(i=0; i<userInputArray3.length; i++){
        userInputArray3[i].addEventListener("change", changeUSChartData);
    }

    for(i=0; i<userInputArray4.length; i++){
        userInputArray4[i].addEventListener("change", filterCANChart);
    }

    for(i=0; i<userInputArray5.length; i++){
        userInputArray5[i].addEventListener("change", changeCANChartData);
    }
}

//get values
function getUserInputs(){

    console.log("get user inputs");

    //Canada
    regionFocusValue = String(regionFocusMenu.value);
    apartmentSizeValue = String(apartmentSizeMenu.value);
    console.log("Region focus input: "+regionFocusValue);
    console.log("Apartment size input: "+apartmentSizeValue);

    if(apartmentSizeValue == "bachelor"){
        dataString = "d.rentBachelor";
        titleString = "Bachelor";
    } else if(apartmentSizeValue == "1 Bed"){
        dataString = "d.rent1Bed";
        titleString = "1 Bedroom";
    } else if(apartmentSizeValue == "2 Bed"){
        dataString = "d.rent2Bed";
        titleString = "2 Bedroom";
    } else if(apartmentSizeValue == "3 Bed"){
        dataString = "d.rent3Bed";
        titleString = "3 Bedroom";
    }

    console.log("Data string: "+dataString);

    //US
    USRegionFocusValue = String(USRegionFocusMenu.value);
    USPopulationSizeValue = String(USPopulationSizeMenu.value);
    USApartmentSizeValue = String(USApartmentSizeMenu.value);
    console.log("US Region focus input: "+USRegionFocusValue);
    console.log("US Population size input: "+USPopulationSizeValue);
    console.log("US Apartment size input: "+USApartmentSizeValue);

    if(USApartmentSizeValue == "1 Bed"){
        USdataString = "d.us1BedRent";
        UStitleString = "1 Bedroom";
    } else if(USApartmentSizeValue == "2 Bed"){
        USdataString = "d.us2BedRent";
        UStitleString = "2 Bedroom";
    }

    console.log("US data string: "+USdataString);

}

//set chart size, draw axes, create ticks, text labels
function setupCANChartSkeleton(){

    //set size and margin parameters for the chart svg space
    chartWidth = Math.min(700,window.innerWidth-35);
    chartHeight = Math.min(700,window.innerHeight-35);

    margin = {top: 35, right: 30, bottom: 50, left: 70},
        width = chartWidth - margin.left - margin.right;
        height = chartHeight - margin.top - margin.bottom;

    // append the svg object to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    svg = d3.select("#CAN_dataviz")
        .append("svg")
        .attr("id","chartSpace")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // Add X axis
    x = d3.scaleLinear()
        .domain([xScaleMin, xScaleMax])
        .range([ 0, width ]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class","xAxis")
        .call(d3.axisBottom(x)
            .tickFormat(d => "$"+d.toLocaleString())
        );

    // text label for the x axis
    svg.append("text")             
        .attr("class","xAxisLabel")
        .attr("transform",
        "translate(" + (width/2) + " ," + 
                        (height + margin.top+10) + ")")
        .style("text-anchor", "middle")
        .text("Household Income (Monthly, After-Tax Avg.)");

    // Add Y axis
    y = d3.scaleLinear()
        .domain([yScaleMin, yScaleMax1])
        .range([height, 0]);
        svg.append("g")
            .attr("class","yAxis")
            .call(d3.axisLeft(y)
                .tickFormat(d => "$"+d.toLocaleString())
            );

    // text label for the y axis
    svg.append("text")
        .attr("class","yAxisLabel")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left+0)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(titleString+ " - Avg. Monthly Rent");   

    //div for tooltip
    tooltipDiv = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // add the X gridlines
    svg.append("g")			
        .attr("class", "xGrid")
        .attr("transform", "translate(0," + height + ")")
        .call(make_x_gridlines()
            .tickSize(-height)
            .tickFormat("")
        )

    // add the Y gridlines
    svg.append("g")			
        .attr("class", "yGrid")
        .call(make_y_gridlines()
            .tickSize(-width)
            .tickFormat("")
        )
    
    //div for linear trendline equation
    svg.append("div")
    .attr("class","equationWrapper")
    text = svg.append('text')
        .attr("class","equation")
        .text("")
        .attr('x', width-210)
        .attr('y', height-25);
    text2 = svg.append('text')
        .attr("class","equation")
        .text("")
        .attr('x', width-210)
        .attr('y', height-10);


    //add chart title
    svg.append("text")
        .attr("x", (width / 2))             
        .attr("y", 0 - (margin.top / 2) +5)
        .attr("class", "chartTitle")  
        .attr("text-anchor", "middle")  
        .text("Rent Prices versus Household Income in Major Canadian Cities");

    // Add group for dots
    svg.append("g");



}

// helper function -- gridlines in x axis function
function make_x_gridlines() {		
    return d3.axisBottom(x)
}

// helper function --  gridlines in y axis function
function make_y_gridlines() {		
    return d3.axisLeft(y)
}

// helper function -- gridlines in x axis function
function make_USx_gridlines() {		
    return d3.axisBottom(USx)
}

// helper function --  gridlines in y axis function
function make_USy_gridlines() {		
    return d3.axisLeft(USy)
}


//read data from CSV file, and place dots on the chart for the first time
function initializeCANChart(){
    console.log("initialize CAN chart");

    //Need to find a better way to do this -- current method hard codes the number of rows,
    //and then only adds the circles once the CSV function reaches the last row of data
    var dataRowCounter = 0;

    //import CSV data and plot data
    d3.csv("rentVersusIncomeData.csv", function(data) {
        
        //console.log("new data row. Data Row Counter: "+dataRowCounter);

        //turn each row of CSV data into a JSON object
        var currentObject = {};
        currentObject["city"] = data.City;
        currentObject["province"] = data.Province;
        currentObject["numHH"] = +data.numHH;
        //currentObject["totalIncome"] = +data.totalIncome;
        //currentObject["afterTaxIncome"] = +data.afterTaxIncome;
        currentObject["monthlyAfterTaxIncome"] = +data.monthlyAfterTaxIncome;
        currentObject["rentBachelor"] = +data.rentBachelor;
        currentObject["rent1Bed"] = +data.rent1Bed;
        currentObject["rent2Bed"] = +data.rent2Bed;
        currentObject["rent3Bed"] = +data.rent3Bed;

        //add city object to the master data array
        jsonArray.push(currentObject);

        
        if(dataRowCounter+1>=numRows) {

            var dots = svg.selectAll(".dot")
                .data(jsonArray)
                .enter()
                .append("circle")
                .attr("class", "dot"); // Assign a class for styling

            dots.on("mouseover", function(event,d) {
                d3.select(this)
                    .style("fill",dotHighlightColour) // new fill colour upon hover
                tooltipDiv.transition()
                    .duration(250)
                    .style("opacity", .85);
                tooltipDiv.html("<b>"+d.city+"</b><br>"
                +"Rent: $"+Math.round(eval(dataString)).toLocaleString()+"<br>"
                +"Income: $"+Math.round(d.monthlyAfterTaxIncome).toLocaleString()+"<br>"
                +"% Ratio: "+Math.round((eval(dataString) / d.monthlyAfterTaxIncome)*1000)/10+"%<br>"
                +"# households: "+Math.round(d.numHH/1000).toLocaleString()+"k")
                    .style("left", (event.pageX + 20) + "px")
                    .style("top", (event.pageY - 20) + "px");
                svg.append('line') //vertical crosshair line
                    .attr("class","crosshairLine")
                    .attr("x1", x(d.monthlyAfterTaxIncome))
                    .attr("y1", height)
                    .attr("x2", x(d.monthlyAfterTaxIncome))
                    .attr("y2", 0);
                svg.append('line') //horizontal crosshair line
                    .attr("class","crosshairLine")
                    .attr("x1", 0)
                    .attr("y1", y(eval(dataString)))
                    .attr("x2", width)
                    .attr("y2", y(eval(dataString))); 
            })
            .on("mouseout", function(d) {
                tooltipDiv.transition()
                    .duration(400)
                    .style("opacity", 0);
                d3.select(this)
                    .transition().duration(400)
                    .style("fill",dotColour);
                d3.selectAll(".crosshairLine")
                    .each(function(d){
                        d3.select(this)
                        .transition().duration(50)
                        .style("opacity", 0)
                        .remove();
                    });
            });

            dots
                .attr("cx", function (d) { return x(d.monthlyAfterTaxIncome); } )
                .attr("cy", function (d) { return y(eval(dataString)); } )
                .attr("r", function (d) { return Math.sqrt(d.numHH)/30; } );

            //add data label for the largest cities
            svg.selectAll(".dataLabel")
                .data(jsonArray)
                .enter()
                .append("text")                
                    .attr("class","dataLabel")
                    .text(function(d){
                        if(d.city == "Toronto" || d.city == "Montreal" || d.city == "Vancouver"){
                            return d.city;
                        } else {
                            return "";
                        }
                    })
                    .attr("x", function (d) { 
            
                        if(d.city == "Toronto"){
                            return x(d.monthlyAfterTaxIncome) - 20; 
                        } else if(d.city == "Montreal"){
                            return x(d.monthlyAfterTaxIncome) - 25; 
                        } else if(d.city == "Vancouver"){
                            return x(d.monthlyAfterTaxIncome) - 30; 
                        }
                    } )
                    .attr("y", function (d) { return y(eval(dataString))+3; } );


            //get x and y values, and feed them to the linear regression analysis
            console.log("json array length: "+jsonArray.length);

            for(i=0; i<jsonArray.length; i++){

                selectedXValues.push(jsonArray[i].monthlyAfterTaxIncome);
                selectedYValues.push(jsonArray[i][dataString.slice(2,dataString.length)]);

            }

            console.log("Selected X Values: "+selectedXValues);
            console.log("Selected Y Values: "+selectedYValues);


            //Draw linear trendline
            var linearTrendline = calcLinear(
                jsonArray,
                "monthlyAfterTaxIncome",
                dataString.slice(2,dataString.length),
                d3.min(jsonArray, function(d){ return d.monthlyAfterTaxIncome }),
                d3.max(jsonArray, function(d){ return d.monthlyAfterTaxIncome }),
            );

            console.log(linearTrendline);

            svg.append("line")
                .attr("class", "regression")
                .attr("x1", x(linearTrendline.ptA.x))
                .attr("y1", y(linearTrendline.ptA.y))
                .attr("x2", x(linearTrendline.ptB.x))
                .attr("y2", y(linearTrendline.ptB.y));

            //create HTML table from CSV data
            console.log("create html table")
            createTableFromJSON(jsonArray);
                
        }

        dataRowCounter++;
        var numDots = document.getElementsByClassName("dot").length;
        console.log("Number of dots: "+numDots);



    });

    //update Y-Axis text label
    svg.selectAll(".yAxisLabel")
        .text(titleString+ " - Avg. Monthly Rent"); 

}


//refresh and re-draw circles based on user input for apartment size
function changeCANChartData(){
    console.log("change chart data");

    getUserInputs();

    var dots = svg.selectAll(".dot")
        .data(jsonArray)
    

    //re-scale the Y-Axis max value depending on the largest y value in the data set
    var yMaxValue = 0;
    
    d3.selectAll(".dot")
        .each(function (d) {
            var currentValue = eval(dataString);
            if(currentValue > yMaxValue){
                yMaxValue = currentValue;
            }
        });

    console.log("Y Max Value: "+yMaxValue);

    if(yMaxValue >= yScaleMax1){
        y.domain([yScaleMin, yScaleMax2]);

        svg.selectAll(".yAxis")
            .transition().duration(1000)
            .call(d3.axisLeft(y)
                .tickFormat(d => "$"+d.toLocaleString())
            );
    
        svg.selectAll(".yGrid")			
            .call(make_y_gridlines()
                .tickSize(-width)
                .tickFormat("")
            );
    } else {
        y.domain([yScaleMin, yScaleMax1]);

        svg.selectAll(".yAxis")
            .transition().duration(1000)
            .call(d3.axisLeft(y)
                .tickFormat(d => "$"+d.toLocaleString())
            );
    
        svg.selectAll(".yGrid")			
            .call(make_y_gridlines()
                .tickSize(-width)
                .tickFormat("")
            );
    }

    //move data points based on new user data selection -- e.g., 1 bed rent vs 3 bed
    dots.transition()
        .delay(100)
        .duration(2000)
        .attr("cx", function (d) { return x(d.monthlyAfterTaxIncome); } )
        .attr("cy", function (d) { return y(eval(dataString)); } )
        .attr("r", function (d) { return Math.sqrt(d.numHH)/30; } );


    dots.on("mouseover", function(event,d) {
        d3.select(this)
            .style("fill",dotHighlightColour) // new fill colour upon hover
        tooltipDiv.transition()
            .duration(250)
            .style("opacity", .85);
        tooltipDiv.html("<b>"+d.city+"</b><br>"
        +"Rent: $"+Math.round(eval(dataString)).toLocaleString()+"<br>"
        +"Income: $"+Math.round(d.monthlyAfterTaxIncome).toLocaleString()+"<br>"
        +"% Ratio: "+Math.round((eval(dataString) / d.monthlyAfterTaxIncome)*1000)/10+"%<br>"
        +"# households: "+Math.round(d.numHH/1000).toLocaleString()+"k")
            .style("left", (event.pageX + 20) + "px")
            .style("top", (event.pageY - 20) + "px");
        svg.append('line') //vertical crosshair line
            .attr("class","crosshairLine")
            .attr("x1", x(d.monthlyAfterTaxIncome))
            .attr("y1", height)
            .attr("x2", x(d.monthlyAfterTaxIncome))
            .attr("y2", 0);
        svg.append('line') //horizontal crosshair line
            .attr("class","crosshairLine")
            .attr("x1", 0)
            .attr("y1", y(eval(dataString)))
            .attr("x2", width)
            .attr("y2", y(eval(dataString))); 
    })
    .on("mouseout", function(d) {
        tooltipDiv.transition()
            .duration(400)
            .style("opacity", 0);
        d3.select(this)
            .transition().duration(400)
            .style("fill",dotColour);
        d3.selectAll(".crosshairLine")
            .each(function(d){
                d3.select(this)
                .transition().duration(50)
                .style("opacity", 0)
                .remove();
            });
    });

    //update data labels
    svg.selectAll(".dataLabel")
        .transition()    
        .delay(100)
        .duration(2000)    
        .attr("x", function (d) { 
            
            if(d.city == "Toronto"){
                return x(d.monthlyAfterTaxIncome) - 20; 
            } else if(d.city == "Montreal"){
                return x(d.monthlyAfterTaxIncome) - 25; 
            } else if(d.city == "Vancouver"){
                return x(d.monthlyAfterTaxIncome) - 30; 
            }
        } )
        .attr("y", function (d) { return y(eval(dataString))+3; } );

    //update Y-Axis text label
    svg.selectAll(".yAxisLabel")
        .text(titleString+ " - Avg. Monthly Rent"); 


    //get x and y values, and feed them to the linear regression analysis

    selectedXValues.length = 0;
    selectedYValues.length = 0;

    for(i=0; i<jsonArray.length; i++){

        selectedXValues.push(jsonArray[i].monthlyAfterTaxIncome);
        selectedYValues.push(jsonArray[i][dataString.slice(2,dataString.length)]);

    }

    console.log("Selected X Values: "+selectedXValues);
    console.log("Selected Y Values: "+selectedYValues);

    //Re-draw linear trendline
    var linearTrendline = calcLinear(
        jsonArray,
        "monthlyAfterTaxIncome",
        dataString.slice(2,dataString.length),
        d3.min(jsonArray, function(d){ return d.monthlyAfterTaxIncome }),
        d3.max(jsonArray, function(d){ return d.monthlyAfterTaxIncome }),
    );

    console.log(linearTrendline);

    d3.selectAll(".regression")
        .transition()
        .delay(100)
        .duration(2000)
        .attr("x1", x(linearTrendline.ptA.x))
        .attr("y1", y(linearTrendline.ptA.y))
        .attr("x2", x(linearTrendline.ptB.x))
        .attr("y2", y(linearTrendline.ptB.y));

}


//highlight circles depending on region group -- atlantic, ON, QC, Prairies, BC
function filterCANChart(){
    console.log("filter chart view");

    getUserInputs();

    //.each allows you to cycle through each selected element -- in this case, everyone of class "dot"
    d3.selectAll(".dot")
        .each(function(d){

            if(regionFocusValue=="All"){
                d3.select(this)
                .transition().duration(400)
                .style("fill",dotColour)
                .style("opacity", 1);
            }

            if(regionFocusValue=="Atlantic"){
                
                if(d.province == "Newfoundland and Labrador" || d.province == "Nova Scotia" || d.province == "New Brunswick" || d.province == "Prince Edward Island"){
                    d3.select(this)
                    .transition().duration(400)
                    .style("fill",dotColour)
                    .style("opacity", 1);  
                } else{
                    d3.select(this)
                    .transition().duration(400)
                    .style("fill",dotFadeColour)
                    .style("opacity", 0.15);  
                }
            }

            if(regionFocusValue=="Quebec"){
                
                if(d.province == "Quebec"){
                    d3.select(this)
                    .transition().duration(400)
                    .style("fill",dotColour)
                    .style("opacity", 1);  
                } else{
                    d3.select(this)
                    .transition().duration(400)
                    .style("fill",dotFadeColour)
                    .style("opacity", 0.15);  
                }
            }

            if(regionFocusValue=="Ontario"){
                
                if(d.province == "Ontario"){
                    d3.select(this)
                    .transition().duration(400)
                    .style("fill",dotColour)
                    .style("opacity", 1);  
                } else{
                    d3.select(this)
                    .transition().duration(400)
                    .style("fill",dotFadeColour)
                    .style("opacity", 0.15);  
                }
            }

            if(regionFocusValue=="Prairies"){
                
                if(d.province == "Manitoba" || d.province == "Saskatchewan" || d.province == "Alberta"){
                    d3.select(this)
                    .transition().duration(400)
                    .style("fill",dotColour)
                    .style("opacity", 1);  
                } else{
                    d3.select(this)
                    .transition().duration(400)
                    .style("fill",dotFadeColour)
                    .style("opacity", 0.15);  
                }
            }

            if(regionFocusValue=="BC"){
                
                if(d.province == "British Columbia"){
                    d3.select(this)
                    .transition().duration(400)
                    .style("fill",dotColour)
                    .style("opacity", 1);  
                } else{
                    d3.select(this)
                    .transition().duration(400)
                    .style("fill",dotFadeColour)
                    .style("opacity", 0.15);  
                }
            }

        });
}


function setupUSChartSkeleton(){
    console.log("setup US chart skeleton");

    //set size and margin parameters for the chart USsvg space
    chartWidth = Math.min(700,window.innerWidth-35);
    chartHeight = Math.min(700,window.innerHeight-35);

    margin = {top: 35, right: 30, bottom: 50, left: 70},
        width = chartWidth - margin.left - margin.right;
        height = chartHeight - margin.top - margin.bottom;

    // append the USsvg object to the body of the page
    // appends a 'group' element to 'USsvg'
    // moves the 'group' element to the top left margin
    USsvg = d3.select("#US_dataviz")
        .append("svg")
        .attr("id","USChartSpace")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // Add X axis
    USx = d3.scaleLinear()
        .domain([USxScaleMin, USxScaleMax1])
        .range([ 0, width ]);
    USsvg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class","USxAxis")
        .call(d3.axisBottom(USx)
            .tickFormat(d => "$"+d.toLocaleString())
        );

    // text label for the x axis
    USsvg.append("text")             
        .attr("class","USxAxisLabel")
        .attr("transform",
        "translate(" + (width/2) + " ," + 
                        (height + margin.top+10) + ")")
        .style("text-anchor", "middle")
        .text("Household Income (Monthly Median)");

    // Add Y axis
    USy = d3.scaleLinear()
        .domain([USyScaleMin, USyScaleMax1])
        .range([height, 0]);
        USsvg.append("g")
            .attr("class","USyAxis")
            .call(d3.axisLeft(USy)
                .tickFormat(d => "$"+d.toLocaleString())
            );

    // text label for the y axis
    USsvg.append("text")
        .attr("class","USyAxisLabel")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left+0)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(UStitleString+ " - Avg. Monthly Rent");   

    //div for tooltip
    UStooltipDiv = d3.select("body").append("div")
        .attr("class", "UStooltip")
        .style("opacity", 0);

    // add the X gridlines
    USsvg.append("g")			
        .attr("class", "USxGrid")
        .attr("transform", "translate(0," + height + ")")
        .call(make_USx_gridlines()
            .tickSize(-height)
            .tickFormat("")
        )

    // add the Y gridlines
    USsvg.append("g")			
        .attr("class", "USyGrid")
        .call(make_USy_gridlines()
            .tickSize(-width)
            .tickFormat("")
        )
    
    //div for linear trendline equation
    USsvg.append("div")
    .attr("class","USequationWrapper")
    text3 = USsvg.append('text')
        .attr("class","USequation")
        .text("")
        .attr('x', width-210)
        .attr('y', height-25);
    text4 = USsvg.append('text')
        .attr("class","USequation")
        .text("")
        .attr('x', width-210)
        .attr('y', height-10);


    //add chart title
    USsvg.append("text")
        .attr("x", (width / 2))             
        .attr("y", 0 - (margin.top / 2) +5)
        .attr("class", "USchartTitle")  
        .attr("text-anchor", "middle")  
        .text("Rent Prices versus Household Income in Major U.S. Cities");

    // Add group for dots
    USsvg.append("g");
}


function initializeUSChart(){
    console.log("initialize US chart");

        //Need to find a better way to do this -- current method hard codes the number of rows,
    //and then only adds the circles once the CSV function reaches the last row of data
    var USdataRowCounter = 0;

    //import CSV data and plot data
    d3.csv("USrentVersusIncomeData.csv", function(data) {
        
        //console.log("new data row. Data Row Counter: "+dataRowCounter);

        //turn each row of CSV data into a JSON object
        var currentObject = {};
        currentObject["usCity"] = data.usCity;
        currentObject["usState"] = data.usState;
        currentObject["usRegion"] = data.usRegion;
        currentObject["usNumHH"] = +data.usNumHH;
        currentObject["usMedianHHIncome"] = +data.usMedianHHIncome;
        currentObject["usMedianMonthlyHHIncome"] = +data.usMedianMonthlyHHIncome;
        currentObject["us1BedRent"] = +data.us1BedRent;
        currentObject["us2BedRent"] = +data.us2BedRent;

        //add city object to the master data array
        USjsonArray.push(currentObject);

        
        if(USdataRowCounter+1>=USnumRows) {

            var USdots = USsvg.selectAll(".USdot")
                .data(USjsonArray)
                .enter()
                .append("circle")
                .attr("class", "USdot") // Assign a class for styling
                .style("fill",USdotColour);

            USdots.on("mouseover", function(event,d) {
                d3.select(this)
                    .style("fill",USdotHighlightColour) // new fill colour upon hover
                UStooltipDiv.transition()
                    .duration(250)
                    .style("opacity", .85);
                UStooltipDiv.html("<b>"+d.usCity+"</b><br>"
                +"Rent: $"+Math.round(eval(USdataString)).toLocaleString()+"<br>"
                +"Income: $"+Math.round(d.usMedianMonthlyHHIncome).toLocaleString()+"<br>"
                +"% Ratio: "+Math.round((eval(USdataString) / d.usMedianMonthlyHHIncome)*1000)/10+"%<br>"
                +"# households: "+Math.round(d.usNumHH/1000).toLocaleString()+"k")
                    .style("left", (event.pageX + 20) + "px")
                    .style("top", (event.pageY - 20) + "px");
                USsvg.append('line') //vertical crosshair line
                    .attr("class","UScrosshairLine")
                    .attr("x1", USx(d.usMedianMonthlyHHIncome))
                    .attr("y1", height)
                    .attr("x2", USx(d.usMedianMonthlyHHIncome))
                    .attr("y2", 0);
                USsvg.append('line') //horizontal crosshair line
                    .attr("class","UScrosshairLine")
                    .attr("x1", 0)
                    .attr("y1", USy(eval(USdataString)))
                    .attr("x2", width)
                    .attr("y2", USy(eval(USdataString))); 
            })
            .on("mouseout", function(d) {
                UStooltipDiv.transition()
                    .duration(400)
                    .style("opacity", 0);
                d3.select(this)
                    .transition().duration(400)
                    .style("fill",USdotColour);
                d3.selectAll(".UScrosshairLine")
                    .each(function(d){
                        d3.select(this)
                        .transition().duration(50)
                        .style("opacity", 0)
                        .remove();
                    });
            });

            USdots
                .attr("cx", function (d) { return USx(d.usMedianMonthlyHHIncome); } )
                .attr("cy", function (d) { return USy(eval(USdataString)); } )
                .attr("r", function (d) { return Math.sqrt(d.usNumHH)/60; } );

            //add data label for the largest cities
            USsvg.selectAll(".USdataLabel")
                .data(USjsonArray)
                .enter()
                .append("text")                
                    .attr("class","USdataLabel")
                    .text(function(d){
                        if(d.usCity == "San Francisco" || d.usCity == "New York" || d.usCity == "Miami" ||  d.usCity == "San Jose"){
                            return d.usCity;
                        } else {
                            return "";
                        }
                    })
                    .attr("x", function (d) { 
            
                        if(d.usCity == "San Francisco"){
                            return USx(d.usMedianMonthlyHHIncome) - 20; 
                        } else if(d.usCity == "New York"){
                            return USx(d.usMedianMonthlyHHIncome) - 20; 
                        } else if(d.usCity == "Miami"){
                            return USx(d.usMedianMonthlyHHIncome) - 20; 
                        } else if(d.usCity == "San Jose"){
                            return USx(d.usMedianMonthlyHHIncome) - 20; 
                        }
                    } )
                    .attr("y", function (d) { return USy(eval(USdataString))+3; } );


            //get x and y values, and feed them to the linear regression analysis
            console.log("US json array length: "+USjsonArray.length);

            for(i=0; i<USjsonArray.length; i++){

                USselectedXValues.push(USjsonArray[i].usMedianMonthlyHHIncome);
                USselectedYValues.push(USjsonArray[i][USdataString.slice(2,USdataString.length)]);

            }

            console.log("US Selected X Values: "+USselectedXValues);
            console.log("US Selected Y Values: "+USselectedYValues);


            //Draw linear trendline
            var linearTrendline = calcLinear(
                USjsonArray,
                "usMedianMonthlyHHIncome",
                USdataString.slice(2,USdataString.length),
                d3.min(USjsonArray, function(d){ return d.usMedianMonthlyHHIncome }),
                d3.max(USjsonArray, function(d){ return d.usMedianMonthlyHHIncome }),
            );

            console.log(linearTrendline);

            USsvg.append("line")
                .attr("class", "USregression")
                .attr("x1", USx(linearTrendline.ptA.x))
                .attr("y1", USy(linearTrendline.ptA.y))
                .attr("x2", USx(linearTrendline.ptB.x))
                .attr("y2", USy(linearTrendline.ptB.y));

                /*
            //create HTML table from CSV data
            console.log("create html table")
            createTableFromJSON(jsonArray);
            */
                
        }

        USdataRowCounter++;
        var USnumDots = document.getElementsByClassName("USdot").length;
        console.log("Number of US dots: "+USnumDots);



    });

    //update Y-Axis text label
    USsvg.selectAll(".USyAxisLabel")
        .text(UStitleString+ " - Avg. Monthly Rent"); 


}


function filterUSChart(){
    console.log("filter US chart");

    getUserInputs();


    console.log("region value: "+USRegionFocusValue + " population size: "+USPopulationSizeValue);

    //.each allows you to cycle through each selected element -- in this case, everyone of class "USdot"
    d3.selectAll(".USdot")
        .each(function(d){

            var populationSize;

            if(d.usNumHH >= USPopulationLargeMin){
                populationSize = "Large";
            } else if(d.usNumHH >= USPopulationMediumMin){
                populationSize = "Medium";
            } else {
                populationSize = "Small";
            }

            if(USRegionFocusValue=="All" && (populationSize == USPopulationSizeValue || USPopulationSizeValue == "All")){
                d3.select(this)
                    .transition().duration(400)
                    .style("fill",USdotColour)
                    .style("opacity", 1);
            } else if(d.usRegion=="Northeast" && USRegionFocusValue == "Northeast" && (populationSize == USPopulationSizeValue || USPopulationSizeValue == "All")){
                d3.select(this)
                    .transition().duration(400)
                    .style("fill",USdotColour)
                    .style("opacity", 1);

            } else if(d.usRegion=="Midwest" && USRegionFocusValue == "Midwest" && (populationSize == USPopulationSizeValue || USPopulationSizeValue == "All")){
                d3.select(this)
                    .transition().duration(400)
                    .style("fill",USdotColour)
                    .style("opacity", 1);  

            } else if(d.usRegion=="West" && USRegionFocusValue == "West" && (populationSize == USPopulationSizeValue || USPopulationSizeValue == "All")){
                d3.select(this)
                    .transition().duration(400)
                    .style("fill",USdotColour)
                    .style("opacity", 1);
  
            } else if(d.usRegion=="South" && USRegionFocusValue == "South" && (populationSize == USPopulationSizeValue || USPopulationSizeValue == "All")){
                d3.select(this)
                    .transition().duration(400)
                    .style("fill",USdotColour)
                    .style("opacity", 1);  

            } else{
                d3.select(this)
                    .transition().duration(400)
                    .style("fill",USdotFadeColour)
                    .style("opacity", 0.15);
  
            }

        });


    //re-scale the X and Y axis -- if input is small, zoom in on the smaller cities -- otherwise, use default axis range

    if(USPopulationSizeValue=="Small"){
    
        USx.domain([USxScaleMin, USxScaleMax2]);
        USy.domain([USyScaleMin, USyScaleMax2]);
    
    } else{
        USx.domain([USxScaleMin, USxScaleMax1]);
        USy.domain([USyScaleMin, USyScaleMax1]); 
    }

    USsvg.selectAll(".USxAxis")
        .transition().duration(1000)
        .call(d3.axisBottom(USx)
            .tickFormat(d => "$"+d.toLocaleString())
        );

    USsvg.selectAll(".USxGrid")			
        .call(make_USx_gridlines()
            .tickSize(-height)
            .tickFormat("")
        );

    USsvg.selectAll(".USyAxis")
        .transition().duration(1000)
        .call(d3.axisLeft(USy)
            .tickFormat(d => "$"+d.toLocaleString())
        );

    USsvg.selectAll(".USyGrid")			
        .call(make_USy_gridlines()
            .tickSize(-width)
            .tickFormat("")
        );

    //move data points based on new user data selection -- e.g., 1 bed rent vs 3 bed
    
    var USdots = d3.selectAll(".USdot");

    USdots.transition()
        .delay(300)
        .duration(1000)
        .attr("cx", function (d) { return USx(d.usMedianMonthlyHHIncome); } )
        .attr("cy", function (d) { return USy(eval(USdataString)); } )
        .attr("r", function (d) { return Math.sqrt(d.usNumHH)/60; } );


    //update data labels
    USsvg.selectAll(".USdataLabel")
        .transition()    
        .delay(100)
        .duration(1200)    
        .attr("x", function (d) { 
            
            if(d.usCity == "San Francisco"){
                return USx(d.usMedianMonthlyHHIncome) - 20; 
            } else if(d.usCity == "New York"){
                return USx(d.usMedianMonthlyHHIncome) - 20; 
            } else if(d.usCity == "Miami"){
                return USx(d.usMedianMonthlyHHIncome) - 20; 
            } else if(d.usCity == "San Jose"){
                return USx(d.usMedianMonthlyHHIncome) - 20; 
            }
        } )
        .attr("y", function (d) { return USy(eval(USdataString))+3; } );

    //update Y-Axis text label
    svg.selectAll(".USyAxisLabel")
        .text(UStitleString+ " - Avg. Monthly Rent"); 


    //get x and y values, and feed them to the linear regression analysis

    USselectedXValues.length = 0;
    USselectedYValues.length = 0;

    for(i=0; i<USjsonArray.length; i++){

        USselectedXValues.push(USjsonArray[i].usMedianMonthlyHHIncome);
        USselectedYValues.push(USjsonArray[i][USdataString.slice(2,USdataString.length)]);

    }

    console.log("Selected US X Values: "+USselectedXValues);
    console.log("Selected US Y Values: "+USselectedYValues);

    //Re-draw linear trendline
    var linearTrendline = calcLinear(
        USjsonArray,
        "usMedianMonthlyHHIncome",
        USdataString.slice(2,USdataString.length),
        d3.min(USjsonArray, function(d){ return d.usMedianMonthlyHHIncome }),
        d3.max(USjsonArray, function(d){ return d.usMedianMonthlyHHIncome }),
    );

    console.log(linearTrendline);

    d3.selectAll(".USregression")
        .transition()
        .delay(100)
        .duration(1500)
        .attr("x1", USx(linearTrendline.ptA.x))
        .attr("y1", USy(linearTrendline.ptA.y))
        .attr("x2", USx(linearTrendline.ptB.x))
        .attr("y2", USy(linearTrendline.ptB.y));

}


function changeUSChartData(){
    console.log("changeUSChartData");

}




// Calculate a linear regression from the data

// Takes 5 parameters:

// (1) Your data
// (2) The column of data plotted on your x-axis
// (3) The column of data plotted on your y-axis
// (4) The minimum value of your x-axis
// (5) The maximum value of your x-axis

// Returns an object with two points, where each point is an object with an x and y coordinate

function calcLinear(data, x, y, minX, maxX){
    /////////
    //SLOPE//
    /////////

    // Let n = the number of data points
    var n = data.length;

    // Get just the points
    var pts = [];
    data.forEach(function(d,i){
        var obj = {};
        obj.x = d[x];
        obj.y = d[y];
        obj.mult = obj.x*obj.y;
        pts.push(obj);
    });

    // Let a equal n times the summation of all x-values multiplied by their corresponding y-values
    // Let b equal the sum of all x-values times the sum of all y-values
    // Let c equal n times the sum of all squared x-values
    // Let d equal the squared sum of all x-values
    var sum = 0;
    var xSum = 0;
    var ySum = 0;
    var sumSq = 0;
    pts.forEach(function(pt){
        sum = sum + pt.mult;
        xSum = xSum + pt.x;
        ySum = ySum + pt.y;
        sumSq = sumSq + (pt.x * pt.x);
    });
    var a = sum * n;
    var b = xSum * ySum;
    var c = sumSq * n;
    var d = xSum * xSum;

    // Plug the values that you calculated for a, b, c, and d into the following equation to calculate the slope
    // slope = m = (a - b) / (c - d)
    var m = (a - b) / (c - d);

    /////////////
    //INTERCEPT//
    /////////////

    // Let e equal the sum of all y-values
    var e = ySum;

    // Let f equal the slope times the sum of all x-values
    var f = m * xSum;

    // Plug the values you have calculated for e and f into the following equation for the y-intercept
    // y-intercept = b = (e - f) / n
    var b = (e - f) / n;


    //US
    USlinearRegressionOutputs = linearRegression(USselectedYValues, USselectedXValues);
    console.log(USlinearRegressionOutputs);

    // Print the linear trendline equation below the chart
    document.getElementsByClassName("USequation")[0].innerHTML =
    "Linear Trendline:"
    +"<br>"
    +" y = "+ Math.round(m*1000)/1000 + "x + "
    + Math.round(b*100)/100;
    
    // Print the r-squared value
    document.getElementsByClassName("USequation")[1].innerHTML =
    "R-squared: "+Math.round(USlinearRegressionOutputs.r2*1000)/1000;


    //Canada
    linearRegressionOutputs = linearRegression(selectedYValues, selectedXValues);
    console.log(linearRegressionOutputs);

    // Print the linear trendline equation below the chart
    document.getElementsByClassName("equation")[0].innerHTML =
    "Linear Trendline:"
    +"<br>"
    +" y = "+ Math.round(m*1000)/1000 + "x + "
    + Math.round(b*100)/100;
    
    // Print the r-squared value
    document.getElementsByClassName("equation")[1].innerHTML =
    "R-squared: "+Math.round(linearRegressionOutputs.r2*1000)/1000;

    // return an object of two points
    // each point is an object with an x and y coordinate
    return {
        ptA : {
        x: minX,
        y: m * minX + b
        },
        ptB : {
        x: maxX,
        y: m * maxX + b
        }
    }

}


function linearRegression(y,x){
    var lr = {};
    var n = y.length;
    var sum_x = 0;
    var sum_y = 0;
    var sum_xy = 0;
    var sum_xx = 0;
    var sum_yy = 0;

    for (var i = 0; i < y.length; i++) {

        sum_x += x[i];
        sum_y += y[i];
        sum_xy += (x[i]*y[i]);
        sum_xx += (x[i]*x[i]);
        sum_yy += (y[i]*y[i]);
    } 

    lr['slope'] = (n * sum_xy - sum_x * sum_y) / (n*sum_xx - sum_x * sum_x);
    lr['intercept'] = (sum_y - lr.slope * sum_x)/n;
    lr['r2'] = Math.pow((n*sum_xy - sum_x*sum_y)/Math.sqrt((n*sum_xx-sum_x*sum_x)*(n*sum_yy-sum_y*sum_y)),2);

    return lr;
}

//https://www.encodedna.com/javascript/populate-json-data-to-html-table-using-javascript.htm
function createTableFromJSON(jsonObject) {

    /*
    // EXTRACT VALUE FOR HTML HEADER. 
    // ('Book ID', 'Book Name', 'Category' and 'Price')
    var col = [];
    for (var i = 0; i < jsonObject.length; i++) {
        for (var key in jsonObject[i]) {
            if (col.indexOf(key) === -1) {
                col.push(key);
            }
        }
    }

    // CREATE DYNAMIC TABLE.
    var table = document.createElement("table");

    // CREATE HTML TABLE HEADER ROW USING THE EXTRACTED HEADERS ABOVE.

    var tr = table.insertRow(-1);                   // TABLE ROW.

    for (var i = 0; i < col.length; i++) {
        var th = document.createElement("th");      // TABLE HEADER.
        th.innerHTML = col[i];
        tr.appendChild(th);
    }

    */

    var table = document.getElementById("dataTable");

    var col = [];

    for (var i = 0; i < jsonObject.length; i++) {
        for (var key in jsonObject[i]) {
            if (col.indexOf(key) === -1) {
                col.push(key);
            }
        }
    }

    console.log(col);
    console.log(jsonObject.length);

    // ADD JSON DATA TO THE TABLE AS ROWS.
    for (var i = 0; i < jsonObject.length; i++) {

        tr = table.insertRow(-1);

        for (var j = 0; j < col.length; j++) {
            var tabCell = tr.insertCell(-1);
            var currentValue = jsonObject[i][col[j]];

            if(j==0 || j==1) {
                tabCell.innerHTML = currentValue;
                tabCell.classList.add("leftAlignCell");
            } else if(j==2){
                tabCell.innerHTML = currentValue.toLocaleString();
                tabCell.classList.add("rightAlignCell");
            } else {
                tabCell.innerHTML = "$"+Math.round(currentValue).toLocaleString();
                tabCell.classList.add("rightAlignCell");
            }
        }
    }

    /*
    // FINALLY ADD THE NEWLY CREATED TABLE WITH JSON DATA TO A CONTAINER.
    var divContainer = document.getElementById("showData");
    divContainer.innerHTML = "";
    divContainer.appendChild(table);
    */
}

