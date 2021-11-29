const url = "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json";

const margin = { top: 120, right: 5, bottom: 120, left: 90 },
    width = 1400 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

const svg = d3.select('body').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .attr('class', 'graph-svg')
  .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

const tooltip = d3.select('body').append('div')
                    .attr('id','tooltip')
                    .style("opacity", 0);

const timeFormat = d3.timeFormat("%B");

const x = d3.scaleBand().range([0, width]);
const y = d3.scaleBand().range([0, height]);

const color = d3.scaleQuantile().range(d3.schemeSpectral[11].reverse());

// const thresholdsMaker = (minTemp, maxTemp, length) => {
//     const arr = [];
//     const interval = (maxTemp - minTemp) / length;
//     for (let i = 1; i < length; i++) {
//         arr.push(minTemp + i * interval);
//     }
//     return arr;  
// }

d3.json(url).then(data => {

    data.monthlyVariance = data.monthlyVariance.map(d => {
        d.month = d.month - 1;
        let temperature = (data.baseTemperature + d.variance).toFixed(1);
        return { ...d, month: d.month, temperature: +temperature };
    });

    //X & Y Scales & Axis
    x.domain(data.monthlyVariance.map( d => d.year));
    const xAxis = d3.axisBottom(x)
                    .tickSizeOuter(0)
                    .tickValues(x.domain().filter(year => year % 10 === 0));

    y.domain(data.monthlyVariance.map( d => d.month ));
    const yAxis = d3.axisLeft(y)
                    .tickFormat(month => {
                        const date = new Date(0);
                        date.setUTCMonth(month);
                        return timeFormat(date);
                    }).tickSizeOuter(0);
    
    //Color Scale
    const temperatures = data.monthlyVariance.map(d => d.temperature);
    const minTemp = Math.min(...temperatures);
    const maxTemp = Math.max(...temperatures);
    //const thresholds = thresholdsMaker(minTemp, maxTemp, color.range().length);
    color.domain([minTemp, maxTemp]);
    
    // X Axis
    svg.append("g").call(xAxis)
         .attr("id", "x-axis")
         .attr("transform", `translate(0, ${height})`);

    // Y Axis
    svg.append("g").call(yAxis)
         .attr("id", "y-axis")
         .attr("transform", `translate(0, 0)`);

    // Data Viz
    svg.selectAll("rect")
       .data(data.monthlyVariance)
       .enter()
       .append("rect")
         .attr("class", "cell")
         .attr("data-month", d => d.month)
         .attr("data-year", d => d.year)
         .attr("data-temp", d => d.temperature)
         .attr("width", x.bandwidth())
         .attr("height", y.bandwidth())
         .attr("x", d => x(d.year))
         .attr("y", d => y(d.month))
         .attr("fill", d => color(d.temperature))
         .on("mouseover", (e, d) => {
             tooltip.attr("data-year", d.year).style("opacity", 0.8)
                    .style("top", e.pageY - 85 + "px")
                    .style("left", e.pageX - 50 + "px")
                    .html(`
                        ${d.year} - ${timeFormat(new Date(0).setMonth(d.month))}<br/>
                        ${d.temperature} °C<br/>
                        ${d.variance < 0 ? d.variance.toFixed(1) 
                                         : "+" + d.variance.toFixed(1)} °C
                        `)
         })
         .on("mouseout", (e, d) => tooltip.style("opacity", 0));
      
    // X Label
    svg.append("text")
         .attr("x", (width - margin.left) / 2)
         .attr("y", height + 40)
         .text("Years")
       
    // Title
    svg.append("text")
         .attr("id", "title")
         .attr("x", width / 2)
         .attr("y", -70)
         .attr("text-anchor", "end")
         .attr("dx", "7%")
         .text("Monthly Global Land-Surface Temperature")

    // Description
    svg.append("text")
         .attr("id", "description")
         .attr("x", width / 2)
         .attr("y", -40)
         .attr("text-anchor", "end")
         .attr("dx", "6%")
         .html(`
            ${Math.min(...data.monthlyVariance.map(d => d.year))} - ${Math.max(...data.monthlyVariance.map(d => d.year))}: base temperature ${data.baseTemperature} °C
         `);
 
    // Legend
    const legendWidth = 500;   
    const legendHeight = 30;   
         
    const xLegend = d3.scaleLinear().domain([minTemp, maxTemp]).range([0, legendWidth]);
    const xAxisLegend = d3.axisBottom(xLegend).tickValues(color.quantiles()).tickFormat(d3.format(".1f"));
  
    const legend = svg.append("g")
                        .attr("id", "legend")
                        .attr("transform", `translate(${margin.left}, ${height + 80})`);
   
    legend.append("g")
          .selectAll("rect")
        //   .data(color.range().map(value => {
        //       let d = color.invertExtent(value);
        //       if (d[0] === null) {
        //            d[0] = legendX.domain()[0];
        //   }
        //       if (d[1] === null) {
        //            d[1] = legendX.domain()[1];
        //   }
        //       return d;
        //   }))
             .data(color.range().slice(1, -1))
          .enter()
          .append("rect")
            .attr("x", d => xLegend(color.invertExtent(d)[0]))
            .attr("y", -legendHeight)
            .attr("width", d =>  xLegend(color.invertExtent(d)[1]) - xLegend(color.invertExtent(d)[0]))
            .attr("height", legendHeight)
            .attr("fill", d => d)
            .attr("stroke", "black")

    legend.append("g")
          .call(xAxisLegend)              
})


