/**
 * Created by carol on 25/01/16.
 */


//historical_data
var chart;
var data;

//var csv is the CSV file with headers
function csvJSON(csv,separator){
    if(!separator)
    {
        separator=",";
    }

    csv.replace("\r","");
    var lines=csv.split("\n");

    var result = [];

    var headers=lines[0].split(separator);

    for(var i=1;i<lines.length;i++){

        var obj = {};
        var currentline=lines[i].split(separator);
        if(currentline.length==headers.length)
        {
            for(var j=0;j<headers.length;j++){
                obj[headers[j].trim()] = currentline[j];
            }

            result.push(obj);
        }

    }

    return result; //JavaScript object
}

function handleFile(myfile)
{
    var staticDate=new Date();
    myfile=myfile[0];
    var blob=myfile.slice();
    var reader = new FileReader();
    //reader.readAsArrayBuffer(blob);
    reader.readAsText(blob);
    reader.addEventListener("loadend", function() {
        //reader.readAsArrayBuffer(blob);

        data=csvJSON(reader.result,";");

        data=data.map(function(e){

            var obj={};
            obj.Household=e.LCLid;

            var dmy = e.Date.split(".");
            obj.Date= new Date(dmy[2], dmy[1] - 1, dmy[0]);
            var tt=e.Time.split(":");
            obj.Time= new Date(staticDate);
            obj.Time.setHours(parseInt(tt[0]));
            obj.Time.setMinutes(parseInt(tt[1]));
            obj.Consumption=parseFloat(e["KWH/hh (per half hour)"].replace(",","."));

            return obj;
        });

        paintGraphs();

    });

}


/* The graph */



function paintGraphs() {

    var data1= getConsumptionVsDate();
    nv.addGraph(function() {
        chart = nv.models.lineChart()
            .options({
                transitionDuration: 300,
                useInteractiveGuideline: true
            })
        ;

        // chart sub-models (ie. xAxis, yAxis, etc) when accessed directly, return themselves, not the parent chart, so need to chain separately
        chart.xAxis
            .axisLabel("Date")
            .staggerLabels(true)

            .tickFormat(function(d) {
                return d3.time.format('%d.%m.%y')(new Date(d))
            });

        chart.yAxis
            .axisLabel('Consumption (KWH)');

        d3.select('#historical_data').append('svg')
            .datum(data1)
            .call(chart);

        nv.utils.windowResize(chart.update);

        return chart;
    });

    var data2= getAccumConsumptionVsDate();
    nv.addGraph(function() {
        chart = nv.models.lineChart()
            .options({
                transitionDuration: 300,
                useInteractiveGuideline: true
            })
        ;

        // chart sub-models (ie. xAxis, yAxis, etc) when accessed directly, return themselves, not the parent chart, so need to chain separately
        chart.xAxis
            .axisLabel("Date")
            .staggerLabels(true)

            .tickFormat(function(d) {
                return d3.time.format('%d.%m.%y')(new Date(d))
            });

        chart.yAxis
            .axisLabel('Consumption (KWH)');

        d3.select('#accumhistorical_data').append('svg')
            .datum(data2)
            .call(chart);

        nv.utils.windowResize(chart.update);

        return chart;
    });

    var data3= getAvgConsumptionVsTime();
    console.log(data3);
    nv.addGraph(function() {
        chart = nv.models.lineChart()
            .options({
                transitionDuration: 300,
                useInteractiveGuideline: true
            })
        ;

        // chart sub-models (ie. xAxis, yAxis, etc) when accessed directly, return themselves, not the parent chart, so need to chain separately
        chart.xAxis
            .axisLabel("Time (HH:MM)")
            .staggerLabels(true)

            .tickFormat(function(d) {
                return d3.time.format('%H:%M')(new Date(d))
            });

        chart.yAxis
            .axisLabel('Consumption (KWH)');

        d3.select('#timehistorical_data').append('svg')
            .datum(data3)
            .call(chart);

        nv.utils.windowResize(chart.update);

        return chart;
    });



}

function getAccumConsumptionVsDate() {
    var results=[];
    var households=Enumerable.From(data).Distinct(function (x) { return x.Household; }).Select(function (a) { return a.Household; }).ToArray();
    households.forEach(function(hh){
        var d=Enumerable.From(data).Where(function(x){
            return x.Household==hh && x.Consumption;
        }).Select(function(a){return a;});
        var d=Enumerable.From(d)
            //.Where(function(x){x.Household==hh})
            .GroupBy("$.Date.getTime()", null,
            //var d=Enumerable.From(data).GroupBy("$.Household", null,
            function (key, g) {
                var result = {
                    x: new Date(key),
                    y: g.Sum("$.Consumption")
                }
                return result;
            })
            .ToArray();

        var d2=[];
        acum=0;
        for(var i=0;i< d.length;i++)
        {
            acum=acum+ d[i].y
            d2.push({
                x: d[i].x,
                y: acum
            });

        }
        results.push({key:hh,values:d2});
    });

    return results;
}

function getAvgConsumptionVsTime()
{
    var results=[];
    var households=Enumerable.From(data).Distinct(function (x) { return x.Household; }).Select(function (a) { return a.Household; }).ToArray();
    households.forEach(function(hh){
        var d=Enumerable.From(data).Where(function(x){
            return x.Household==hh && x.Consumption;
        }).Select(function(a){return a;});
        var d=Enumerable.From(d)
            //.Where(function(x){x.Household==hh})
            .GroupBy("$.Time.getTime()", null,
            //var d=Enumerable.From(data).GroupBy("$.Household", null,
            function (key, g) {
                var result = {
                    x: new Date(key),
                    y: g.Sum("$.Consumption")
                }
                return result;
            })
            .ToArray();

        results.push({key:hh,values:d});
    });

    return results;
}

function getConsumptionVsDate()
{
    var results=[];
    var households=Enumerable.From(data).Distinct(function (x) { return x.Household; }).Select(function (a) { return a.Household; }).ToArray();
    households.forEach(function(hh){
        var d=Enumerable.From(data).Where(function(x){
            return x.Household==hh && x.Consumption;
        }).Select(function(a){return a;});
        var d=Enumerable.From(d)
            //.Where(function(x){x.Household==hh})
            .GroupBy("$.Date.getTime()", null,
            //var d=Enumerable.From(data).GroupBy("$.Household", null,
            function (key, g) {
                var result = {
                    x: new Date(key),
                    y: g.Sum("$.Consumption")
                }
                return result;
            })
            .ToArray();

        results.push({key:hh,values:d});
    });

    return results;
}


/* Default example:*/
function sinAndCos() {
    var sin = [],
        sin2 = [],
        cos = [],
        rand = [],
        rand2 = []
        ;

    for (var i = 0; i < 100; i++) {
        sin.push({x: i, y: i % 10 == 5 ? null : Math.sin(i/10) }); //the nulls are to show how defined works
        sin2.push({x: i, y: Math.sin(i/5) * 0.4 - 0.25});
        cos.push({x: i, y: .5 * Math.cos(i/10)});
        rand.push({x:i, y: Math.random() / 10});
        rand2.push({x: i, y: Math.cos(i/10) + Math.random() / 10 })
    }

    return [
        {
            area: true,
            values: sin,
            key: "Sine Wave",
            color: "#ff7f0e",
            strokeWidth: 4,
            classed: 'dashed'
        },
        {
            values: cos,
            key: "Cosine Wave",
            color: "#2ca02c"
        },
        {
            values: rand,
            key: "Random Points",
            color: "#2222ff"
        },
        {
            values: rand2,
            key: "Random Cosine",
            color: "#667711",
            strokeWidth: 3.5
        },
        {
            area: true,
            values: sin2,
            key: "Fill opacity",
            color: "#EF9CFB",
            fillOpacity: .1
        }
    ];
}
