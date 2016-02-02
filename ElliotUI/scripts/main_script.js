/// <reference path="libs/geoxml3.js" />
/// <reference path="libs/jquery-2.1.1.min.js" />
var minZoomLevel = 9;

var myMap = new google.maps.Map(document.getElementById("my_map"), {
    zoom:minZoomLevel
});
var myParser = new geoXML3.parser({ 
    map: myMap,
    zoom: true,    
    afterParse:useTheData,  
});


myParser.parse("kml.xml");
var isShow = "No";
var interval = $("#refresh_rate").val();

function useTheData(doc) {
    addPacientsAside(doc[0].placemarks);
    addPacientEmergncy(doc[0].placemarks);
}

function addPacientsAside(pacients) {
           
    for (var i = 0; i < pacients.length; i++) {      
        createPacientDescription(pacients[i]);
    }                  
}

function addPacientEmergncy(pacients) {
    
    for (var i = 0; i < pacients.length; i++) {      
        if (pacients[i].styleUrl === "#PatientStyleEmergency") {           
            addPacientEmergencyDescription(pacients[i],i);
        }
    }
}

function createPacientDescription(pacient) {
    var div = $("<div>");
    div.addClass("pacient_desctiption_node");
    div.addClass("hide");

    var descriptionHeader = $("<div>");

    var image = $("<img>");
    var url;
    var patientState;

    if (pacient.styleUrl === "#PatientStyleNormal") {
        url = "./resources/patient-icon.png";
        patientState = "Normal";
    } else {
        url = "./resources/emergency-icon.png";
        patientState = "Emergency";
    }
    image.attr("src", url);
    descriptionHeader.html(patientState);
           

    var name = $("<span>");
    name.addClass("pacient_name")
    name.html(pacient.name);

    div.append(descriptionHeader);
    div.append(image);
    div.append(name);

    var update = $("<div>");
    update.html(pacient.description);
    div.append(update);

           
    $(".names_section").append(div);
}

function addPacientEmergencyDescription(pacient,id) {
    var div = $("<div>");
    div.addClass("emergency_pacient_desctiption_node");
    var idNumber = $("<span>");
    idNumber.addClass("hideId");
    idNumber.html(id);
    div.append(idNumber);
    var name = $("<span>");
    name.html(pacient.name);      
    div.append(name);
    var update = $("<div>");
    update.html(pacient.description);
    div.append(update);
    var timer = $("<div>");
    timer.addClass("timer");
    div.append(timer);
    var timerObj = new timerMod.Timer();
    setInterval(function () {
        timer.html("Time in emergency state:"+timerObj.toString());
        timerObj.update();
    }, 1000);

    $(".emergency_section").append(div);
}

$("#show").on("click", function () {   
    if (isShow === "No") {
        $(".pacient_desctiption_node").removeClass("hide").addClass("show");
        isShow = "Yes";               
    } else {
        $(".pacient_desctiption_node").removeClass("show").addClass("hide");
        isShow = "No";
    }

});

$("#search_btn").on("click", function () {
    $(".pacient_desctiption_node").removeClass("show").addClass("hide");
    var searchedName = $("#name_search").val();
    var nameNodes = $(".pacient_name");                  
    $.each(nameNodes, function () {                   
        if ($(this).text().indexOf(searchedName) > -1) {
            console.log($(this).text());
            $(this).parent().removeClass("hide").addClass("show");
        }              
    });                 
});

$("#refresh_rate").bind("keyup mouseup", function () {    
    interval = $("#refresh_rate").val();
});

$("#fit_bounds").change(function () {
    
    if ($(this).prop("checked") == true) {
        minZoomLevel = 9;
        myMap = new google.maps.Map(document.getElementById("my_map"), {
            zoom:minZoomLevel
        });
        myParser = new geoXML3.parser({
            map: myMap,
            zoom:true,
            afterParse: function (doc) {             
                atachEvents(doc[0].bounds, doc[0].markers);
                if ($("#show_names").prop("checked") == true) {
                    displayInfoWindows(doc[0].markers);
                }
            }
        });
        myParser.parse("kml.xml");
       
    } else {
        google.maps.event.clearListeners(myMap, "dragend");
        google.maps.event.clearListeners(myMap, "zoom_changed");
    }
});

$("#show_names").change(function () {
    
        myMap = new google.maps.Map(document.getElementById("my_map"), {
            zoom: minZoomLevel
        });
        myParser = new geoXML3.parser({
            map: myMap,
            zoom: true,
            afterParse: function (doc) {               
                if ($("#fit_bounds").prop("checked") == true) {
                    atachEvents(doc[0].bounds, doc[0].markers);
                    
                } 
                if ($("#show_names").prop("checked") == true) {
                    displayInfoWindows(doc[0].markers);
                }
            }
        });
        myParser.parse("kml.xml");
   
});

function refresh() {   
    myMap = new google.maps.Map(document.getElementById("my_map"), {
        zoom:minZoomLevel
    });

     myParser = new geoXML3.parser({
         map: myMap,
         zoom: true,        
        afterParse: update
    });
    myParser.parse("kml.xml");
    setTimeout(refresh, interval*1000);
};

setTimeout(refresh, interval * 1000);
setTimeout(alertEmergency, 1000);
   

function alertEmergency() {
    if ($(".emergency_section").children().length > 0) {       
        $(".emergency_section").toggleClass("alert");
    }
    setTimeout(alertEmergency, 1000);
}

function update(doc) {
    
    if ($("#fit_bounds").prop("checked") == true) {      
        atachEvents(doc[0].bounds, doc[0].markers);     
    }  
    if ($("#show_names").prop("checked") == true) {
        displayInfoWindows(doc[0].markers);
    }

    emergencyDelete(doc[0].placemarks);
    emergencyAdd(doc[0].placemarks);
}



function atachEvents(bounds,markers) {   
    google.maps.event.addListener(myMap, "dragend", function () {             
        if (bounds.contains(myMap.getCenter())) {
            return;
        }

        var c = myMap.getCenter(),
        x = c.lng(),
        y = c.lat(),
        maxX = bounds.getNorthEast().lng(),
        maxY = bounds.getNorthEast().lat(),
        minX = bounds.getSouthWest().lng(),
        minY = bounds.getSouthWest().lat();

        if (x < minX) x = minX;
        if (x > maxX) x = maxX;
        if (y < minY) y = minY;
        if (y > maxY) y = maxY;

        myMap.setCenter(new google.maps.LatLng(y, x));
    });

    google.maps.event.addListener(myMap, "zoom_changed", function () {
        if (myMap.getZoom() < minZoomLevel || myMap.getZoom() > minZoomLevel) myMap.setZoom(minZoomLevel);
    });
    
   
}

function displayInfoWindows(markers) {
   
    for (var i = 0; i < markers.length; i++) {
        google.maps.event.addListener(markers[i], "click", function () {
            
        })
        google.maps.event.trigger(markers[i], "click");
        
    }
}

function emergencyDelete(pacients) {

    var emergencyCollection = $(".emergency_pacient_desctiption_node");

    for (var i = 0; i < pacients.length; i++) {
        for (var j = 0; j < emergencyCollection.length; j++) {
            if (i == $(emergencyCollection[j]).children().first().html()) {
                if (pacients[i].styleUrl != "#PatientStyleEmergency") {
                    $(emergencyCollection[j]).remove();
                }
            }
        }
    }

}

function emergencyAdd(pacients) {
    var emergencyCollection = $(".emergency_pacient_desctiption_node");
    
    if (emergencyCollection.length > 0) {
        for (var i = 0; i < pacients.length; i++) {
            var isInEmergencyList = false;
            for (var j = 0; j < emergencyCollection.length; j++) {               
                if (i == $(emergencyCollection[j]).children().first().html()) {
                    isInEmergencyList = true;
                }                
            }
            if (isInEmergencyList == false && pacients[i].styleUrl == "#PatientStyleEmergency") {
                addPacientEmergencyDescription(pacients[i], i);
            }
        }
    } else {
        addPacientEmergncy(pacients);
    }
}

var timerMod = (function () {

    function formatTime(num){
        var strResult = num + "";
        if(strResult.length < 2) {
           strResult = "0" + num;
        }
        return strResult;
    }

    var Timer = (function () {
        var Timer = function () {
            this.hour = 0;
            this.minute = 0;
            this.second = 0;
        }
        Timer.prototype.update = function () {
            this.second++;
            if (this.second > 59) {
                this.second = 0;
                this.minute++;
            }
            if (this.minute > 59) {
                this.minute = 0;
                this.hour++;
            }

        }
        Timer.prototype.toString = function () {
            return formatTime(this.hour) + ":" + formatTime(this.minute) + ":" + formatTime(this.second);
        }
        return Timer;
    }());
    return {
        Timer: Timer
    };
}());







