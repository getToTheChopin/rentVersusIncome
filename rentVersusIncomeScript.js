/*
To do:
Animation between years -- old vs current data?
Add sortable table below -- city, income, rent (1 bed, 2 bed, etc...), rent to income ratio %, # households
Add chart title with dynamic text -- dynamic text for y axis title
Other formatting
US city data on a separate chart?
*/

//array which will hold the data as JSON objects -- one object per city
var jsonArray = [];

var regionFocusMenu = document.getElementById("regionFocusMenu");
var userInputArray = document.getElementsByClassName("filterRegionInput");

var apartmentSizeMenu = document.getElementById("apartmentSizeMenu");
var userInputArray2 = document.getElementsByClassName("apartmentSizeInput");

var dataString = "";

var regionFocusValue = "";
var apartmentSizeValue = "";

var svg;

var chartHeight;
var chartWidth;
var margin;
var width;
var height;


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

var linearRegressionOutputs = {};


//main method
addEventListeners();
getUserInputs();
setupChartSkeleton();
initializeChart();

//event listeners for user input menus
function addEventListeners(){
    console.log("add event listeners");

    for(i=0; i<userInputArray.length; i++){
        userInputArray[i].addEventListener("change", filterChart);
    }

    for(i=0; i<userInputArray2.length; i++){
        userInputArray2[i].addEventListener("change", changeChartData);
    }
}

//get values
function getUserInputs(){

    console.log("get user inputs");

    regionFocusValue = String(regionFocusMenu.value);
    apartmentSizeValue = String(apartmentSizeMenu.value);
    console.log("Region focus input: "+regionFocusValue);
    console.log("Apartment size input: "+apartmentSizeValue);

    if(apartmentSizeValue == "bachelor"){
        dataString = "d.rentBachelor";
    } else if(apartmentSizeValue == "1 Bed"){
        dataString = "d.rent1Bed";
    } else if(apartmentSizeValue == "2 Bed"){
        dataString = "d.rent2Bed";
    } else if(apartmentSizeValue == "3 Bed"){
        dataString = "d.rent3Bed";
    }

    console.log("Data string: "+dataString);

}

//set chart size, draw axes, create ticks, text labels
function setupChartSkeleton(){

    //set size and margin parameters for the chart svg space
    chartWidth = Math.min(700,window.innerWidth-35);
    chartHeight = Math.min(700,window.innerHeight-35);

    margin = {top: 30, right: 30, bottom: 50, left: 70},
        width = chartWidth - margin.left - margin.right;
        height = chartHeight - margin.top - margin.bottom;

    // append the svg object to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    svg = d3.select("#my_dataviz")
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
        .attr("class","axisLabel")
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
        .attr("class","axisLabel")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left+0)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Rent for 2 Bedroom Apartment (Avg.)");   

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


//read data from CSV file, and place dots on the chart for the first time
function initializeChart(){
    console.log("initialize chart");

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
        currentObject["totalIncome"] = +data.totalIncome;
        currentObject["afterTaxIncome"] = +data.afterTaxIncome;
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
                    .style("fill","#1feebe") // new fill colour upon hover
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
                    .style("fill","#40c5a6");
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
                
        }

        dataRowCounter++;
        var numDots = document.getElementsByClassName("dot").length;
        console.log("Number of dots: "+numDots);

    });

}


//refresh and re-draw circles based on user input for apartment size
function changeChartData(){
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
            .style("fill","#1feebe") // new fill colour upon hover
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
            .style("fill","#40c5a6");
        d3.selectAll(".crosshairLine")
            .each(function(d){
                d3.select(this)
                .transition().duration(50)
                .style("opacity", 0)
                .remove();
            });
    });


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
function filterChart(){
    console.log("filter chart view");

    getUserInputs();

    //.each allows you to cycle through each selected element -- in this case, everyone of class "dot"
    d3.selectAll(".dot")
        .each(function(d){

            if(regionFocusValue=="All"){
                d3.select(this)
                .transition().duration(400)
                .style("fill","#40c5a6")
                .style("opacity", 1);
            }

            if(regionFocusValue=="Atlantic"){
                
                if(d.province == "Newfoundland and Labrador" || d.province == "Nova Scotia" || d.province == "New Brunswick" || d.province == "Prince Edward Island"){
                    d3.select(this)
                    .transition().duration(400)
                    .style("fill","#40c5a6")
                    .style("opacity", 1);  
                } else{
                    d3.select(this)
                    .transition().duration(400)
                    .style("fill","gray")
                    .style("opacity", 0.15);  
                }
            }

            if(regionFocusValue=="Quebec"){
                
                if(d.province == "Quebec"){
                    d3.select(this)
                    .transition().duration(400)
                    .style("fill","#40c5a6")
                    .style("opacity", 1);  
                } else{
                    d3.select(this)
                    .transition().duration(400)
                    .style("fill","gray")
                    .style("opacity", 0.15);  
                }
            }

            if(regionFocusValue=="Ontario"){
                
                if(d.province == "Ontario"){
                    d3.select(this)
                    .transition().duration(400)
                    .style("fill","#40c5a6")
                    .style("opacity", 1);  
                } else{
                    d3.select(this)
                    .transition().duration(400)
                    .style("fill","gray")
                    .style("opacity", 0.15);  
                }
            }

            if(regionFocusValue=="Prairies"){
                
                if(d.province == "Manitoba" || d.province == "Saskatchewan" || d.province == "Alberta"){
                    d3.select(this)
                    .transition().duration(400)
                    .style("fill","#40c5a6")
                    .style("opacity", 1);  
                } else{
                    d3.select(this)
                    .transition().duration(400)
                    .style("fill","gray")
                    .style("opacity", 0.15);  
                }
            }

            if(regionFocusValue=="BC"){
                
                if(d.province == "British Columbia"){
                    d3.select(this)
                    .transition().duration(400)
                    .style("fill","#40c5a6")
                    .style("opacity", 1);  
                } else{
                    d3.select(this)
                    .transition().duration(400)
                    .style("fill","gray")
                    .style("opacity", 0.15);  
                }
            }

        });
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