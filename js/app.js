

// Dom7
var $ = Dom7;
// Theme
var theme = 'auto';
if (document.location.search.indexOf('theme=') >= 0) 
{
  theme = document.location.search.split('theme=')[1].split('&')[0];
}
localStorage.setItem("firebaseScriptsLoaded","false");
try{
  // Init App
  var app = new Framework7(
  {
    id: 'io.framework7.testapp',
    root: '#app',
    theme: theme,
    routes: routes,
    materialRipple: false,
    fastClicks: false,
    activeState: false,
    tapHold: false,
    tapHoldPreventClicks: false,
    swipeBackPage: false,
    navbar: 
    {
      mdCenterTitle: true
    },
  });
  
  localStorage.setItem("Framework7Initialised", "true");
}
catch(err)
{
  console.log(" initialize framework7: " + err);
}



/*firebase initialisation*/
var firebaseConfig, database, storage, mymap, polylineCoords, lat, long, polyline;
var polylineLines = [];
var polylineNames = [];
// Initialize Firebase
//localStorage.setItem("EersteKeerGeladen","false"); 
/*
function addScripts()
{
  var div = document.getElementById("firebaseScripts");
  var firebaseScript1 = document.createElement("script");
  firebaseScript1.src = "https://www.gstatic.com/firebasejs/8.2.7/firebase-app.js";
  div.appendChild(firebaseScript1);

  var firebaseScript2 = document.createElement("script");
  firebaseScript2.src = "https://www.gstatic.com/firebasejs/8.2.7/firebase-database.js";
  div.appendChild(firebaseScript2);

  var firebaseScript3 = document.createElement("script");
  firebaseScript3.src = "https://www.gstatic.com/firebasejs/8.2.7/firebase-storage.js";
  div.appendChild(firebaseScript3);
  localStorage.setItem("firebaseScriptsLoaded","true");
}
*/
app.dialog.preloader();
Setup();
function Setup()
{
  localStorage.setItem("MapNLInitialised","false");
  localStorage.removeItem("polyline");
  if(localStorage.getItem("reloaded") == null)
  {
    localStorage.setItem("reloaded","false");
    console.log("set reloaded");
  }
  checkConnection();
  getStatus();
  var ScriptAndUpdateCheckInterval = setInterval(function(){
    if(localStorage.getItem("InternetStatus") != null && localStorage.getItem("firebaseScriptsLoaded") == "true")
    {
      clearInterval(ScriptAndUpdateCheckInterval);
      ScriptAndUpdateCheck();
    }
  }, 200);
}


function getStatus()
{
  var internetStatus;
  var x = setInterval(function()
  {
    if(localStorage.getItem("InternetStatus")!= null)
    {
      internetStatus = localStorage.getItem("InternetStatus");
      clearInterval(x);
      var confirminterval = setInterval(function()
      {
        if(internetStatus == "Offline" && (localStorage.getItem("EersteKeerGeladen") == "false" || localStorage.getItem("EersteKeerGeladen") == null))
        { 
          if (confirm('Zet je wifi of 4G aan zodat alles ingeladen kan worden. Dit hoeft maar 1 keer te gebeuren')) 
          {
            localStorage.setItem("AppVersion", 0);
            clearInterval(confirminterval);
            checkConnection();
            getStatus();
          } 
          else 
          {
            clearInterval(confirminterval);
            checkConnection();
            getStatus();
          }
        }
        else if(internetStatus == "Online")
        {
          clearInterval(confirminterval);
          console.log("oke laad scripts");
          loadScripts();
        }
        else if(internetStatus == "Offline" && (localStorage.getItem("EersteKeerGeladen") == "true"))
        {
          app.dialog.close();
        }
      },200);
    }
  },100);
}


function loadScripts()
{
  try
  {
    var div = document.getElementById("firebaseScripts");
    var firebaseScript1 = document.createElement("script");
    firebaseScript1.src = "https://www.gstatic.com/firebasejs/8.2.7/firebase-app.js";
    document.body.appendChild(firebaseScript1);
  }
  catch(err)
  {
    alert("initialisatie eerste firebase script: " + err);
  }

  var searchscriptInterval = setInterval(() => 
  {
    var script1 = document.querySelector('script[src="https://www.gstatic.com/firebasejs/8.2.7/firebase-app.js"]');
    if(script1 != null)
    {
      console.log("niet null");
      clearInterval(searchscriptInterval);
      try
      {
          var firebaseScript2 = document.createElement("script");
          firebaseScript2.src = "https://www.gstatic.com/firebasejs/8.2.7/firebase-database.js";
          document.body.appendChild(firebaseScript2);
      }
      catch(err)
      {
        alert("initialisatie 2e firebase script: " + err);
      }
    }
    else
    {
      console.log("null");
    }
  }, 100);

  var searchscript2Interval = setInterval(() => 
  {
    var script2 = document.querySelector('script[src="https://www.gstatic.com/firebasejs/8.2.7/firebase-database.js"]');
    if(script2 != null)
    {
      clearInterval(searchscript2Interval);
      try
      {
          var firebaseScript3 = document.createElement("script");
          firebaseScript3.src = "https://www.gstatic.com/firebasejs/8.2.7/firebase-storage.js";
          document.body.appendChild(firebaseScript3);
          localStorage.setItem("firebaseScriptsLoaded","true");
      }
      catch(err)
      {
        alert("initialisatie 3e firebase script: " + err);
      }
      
    }
  },100);
}

function checkConnection()
{
  var xhr = new XMLHttpRequest();
  var file = "https://i.imgur.com/7ofBNix.png";
  var randomNum = Math.round(Math.random() * 10000);

  xhr.open('HEAD', file + "?rand=" + randomNum, true);
  xhr.send();
    
  xhr.addEventListener("readystatechange", processRequest, false);

  function processRequest(e) 
  {
    if (xhr.readyState == 4) 
    {
      if (xhr.status >= 200 && xhr.status < 304) 
      {
        //online
        localStorage.setItem("InternetStatus","Online");
        console.log("Online");
      } 
      else 
      {
        //offline
        localStorage.setItem("InternetStatus","Offline");
        console.log("Offline");
      }
    }
  }
}


function AantalAssets()
{
  //alert("in aantalassets");
  var x = 0;
  try
  {
    var refroutes = firebase.database().ref('flamelink/environments/production/content/routes/en-US');
    firebase.database().ref(refroutes).on('value', function(snapshot)
    {
      //alert("in firebase query");
      x = snapshot.numChildren();
      var refGates = firebase.database().ref('flamelink/environments/production/content/gates/en-US');
      refGates.on("value", function(gatesnapshot) 
      {
        //alert("in laatste query");
        x = x + gatesnapshot.numChildren();
        localStorage.setItem("aantalAssets",x);
        //alert("aantal assets:" + x);
      });
    });
  }
  catch(err) 
  {
    alert("aantal assets: " + err.message);
    location.reload();
  }
}
function CheckInternet()
{
  var xhr = new XMLHttpRequest();
  var file = "https://i.imgur.com/7ofBNix.png";
  var randomNum = Math.round(Math.random() * 10000);

  xhr.open('HEAD', file + "?rand=" + randomNum, true);
  xhr.send();
    
  xhr.addEventListener("readystatechange", processRequest, false);

  function processRequest(e) 
  {
    if (xhr.readyState == 4) 
    {
      if (xhr.status >= 200 && xhr.status < 304) 
      {
        //alert("online");
        localStorage.setItem("InternetStatus","Online");

      } 
      else 
      {
        //alert("offline");
        localStorage.setItem("InternetStatus","Offline");
      }
    }
  }
}
function InizializeFirebase()
{
  if(localStorage.getItem("firebaseScriptsLoaded") == "true")
  {
    //clearInterval(beginInterval);
    //alert("firebasescriptsloaded = TRUE");
    try
    {
      firebaseConfig = 
      {
        apiKey: "AIzaSyBRh6vB7DoTxaH9jz4BgEIBMfkKxmHO-sg",
        authDomain: "zonienwoud-b21d4.firebaseapp.com",
        databaseURL: "https://zonienwoud-b21d4.firebaseio.com",
        projectId: "zonienwoud-b21d4",
        storageBucket: "zonienwoud-b21d4.appspot.com",
        messagingSenderId: "675674796995",
        appId: "1:675674796995:web:b073e15b7413f9ea"
      };
    }
    catch(err)
    {
      console.log("define firebase: " + err);
    }
    try
    {
      firebase.initializeApp(firebaseConfig);
    }
    catch(err)
    {
      console.log("initialize error" + err);
    }
    try
    {
      database = firebase.database();
    }
    catch(err)
    {
      console.log("database error" + err);
    }
    try
    {
      storage = firebase.storage();
    }
    catch(err)
    {
      console.log("storage error" + err);
    }
  }
}
function infoOphalen()
{
  //addScripts();
  InizializeFirebase();
  // voor deze 3 lijnen appart een try catch doen
  
  /*firebase.initializeApp(firebaseConfig);
  database = firebase.database();
  storage = firebase.storage();*/
  //alert("begin is online");
  //---------------------------------------------------------------------------
  try
  {
    AantalAssets();
  }
  catch(err)
  {
    alert("aantal assets error: " + err);
  }
  
  var aantalAssets = 0;
  var geladenAssets = 0;
  var progress = 0;
  app.dialog.close();
  var dialog = app.dialog.progress('Loading assets', progress);
  var assetsInterval = setInterval(function()
  {
    if(localStorage.getItem("aantalAssets") != null)
    {
      //alert("aantalassets niet null");
      aantalAssets = localStorage.getItem("aantalAssets");
      dialog.setText("Asset 0 of " + aantalAssets+ " loaded");
      clearInterval(assetsInterval);
      //alert("het is na de dialog code");
      var berekenProgress =  100 / aantalAssets;
      //console.log("aantal assets: " + aantalAssets);
      //console.log("aantal assets = " + aantalAssets);
      
      if(localStorage.getItem("EersteKeerGeladen") == null)
      {
        //alert("het is null");
        localStorage.setItem("EersteKeerGeladen","false");
      }
      if(localStorage.getItem("EersteKeerGeladen") == "false")
      {
        //----------------------------Data over gates ophalen-------------------------------------------------
        var gates = [];
        try
        {
          //alert("gates ophalen");
          var refGates = firebase.database().ref('flamelink/environments/production/content/gates/en-US');
          refGates.on("value", function(snapshot) 
          {
            if (snapshot.exists()) 
            {
              //console.log("aantal children : " + snapshot.numChildren());
              snapshot.forEach(function(childSnapshot)  
              {
                var childData = childSnapshot.val();
                //console.log(childData);
                for (var key of Object.keys(childData)) 
                {
                  if(key == "__meta__")
                  {
                    delete childData[key];
                  }
                }
                gates.push(childData);
                //console.log(childData);
                progress = progress + berekenProgress;
                localStorage.setItem("progress",progress);
                console.log("gates progress:" + progress);
                dialog.setProgress(localStorage.getItem("progress"));
                geladenAssets = geladenAssets + 1;
                localStorage.setItem("geladenAssets", geladenAssets);
                dialog.setText("Asset " + geladenAssets + " of " + aantalAssets+ " loaded");
              });
              localStorage.setItem("Gates",JSON.stringify(gates));
            }
            else 
            {
              console.log("No data available");
            } 
          });
          //-----------------------------------------------------------------------------------------------------
        }
        catch(err)
        {
          console.log("laatste assets laden: " + err);
        }
        //------------------------------------Data over routes ophalen---------------------------------
        var localstorageRouteNames = [];
        //alert("net voor try");
        try
        {
          var refroutes = firebase.database().ref('flamelink/environments/production/content/routes/en-US');
          firebase.database().ref(refroutes).on('value', function(snapshot)
          {
            //alert("in de firebase.on voor laatste assets");
            snapshot.forEach(function(childSnapshot)  
            {
              //alert("in de foreach voor laatste assets");
              var value = childSnapshot.val();
              for (var key of Object.keys(value)) 
              {
                if(key == "__meta__")
                {
                  //console.log(key + " -> " + x[key]);
                  delete value[key];
                }
                // console.log(key + " -> " + x[key]);
              }
              localstorageRouteNames.push(value.uniqueName)
              localStorage.setItem(value.uniqueName, JSON.stringify(value));
              //-----------------------Excel fetch----------------------------------------------
              var url = value.routePoints;
              try
              {
                /* set up async GET request */
                var req = new XMLHttpRequest();
                req.open("GET", url, true);
                req.responseType = "arraybuffer";
                
                req.onload = function(e) 
                {
                  var data = new Uint8Array(req.response);
                  var workbook = XLSX.read(data, {type:"array"});
                
                  /* DO SOMETHING WITH workbook HERE */
                  var numberOfSheets = workbook.SheetNames.length;
                  for (var i = 0; i < numberOfSheets; i++) 
                  {  
                    //alert("in de for voor laatste assets");
                    var Sheet = workbook.SheetNames[i];
                    var excelRows = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[Sheet]);
                    var sheetName = workbook.SheetNames[i].replace(/ /g, '');
                    var arraySheetName = sheetName.replace("-", '');
                    var obj = excelRows;
                    var key = Object.keys(obj);
                    progress = progress + berekenProgress;
                    localStorage.setItem("progress",progress);
                    //alert("geladen assets:" + geladenAssets);
                    try
                    {
                      dialog.setProgress(localStorage.getItem("progress"));
                      geladenAssets = geladenAssets + 1;
                      localStorage.setItem("geladenAssets", geladenAssets);
                    }
                    catch(err)
                    {
                      alert("route error: " + err);
                    }
                    try
                    {
                      var uniqueName = value.uniqueName;
                      uniqueName = uniqueName.replace(/\s/g, "");
                      dialog.setText("Asset " + geladenAssets + " of " + aantalAssets+ " loaded");
                      localStorage.setItem(uniqueName + "RoutePoints",JSON.stringify(obj,null,2));
                    }
                    catch(err)
                    {
                      alert("dialog en routepoints localstorage: " + err);
                    }
                  }
                  //alert( geladenAssets+ " routes opgehaald");
                 
                  //console.log(value.uniqueName +"RoutePoints");
                };
                req.send();
              }
              catch(err)
              {
                alert("xml request error: " + err);
              }
              //-------------------------------------------------------------------------------
            });
              localStorage.setItem("routeNames", JSON.stringify(localstorageRouteNames));
              //alert("localstorage aangemaakt");
          
            //console.log(routeData[0][0]);
            
          });
        }
        catch(err)
        {
          alert("eerste assets laden: " + err);
        }
          //---------------------------------------------------------------------------------------------------
        
      }
      else
      {
        alert("data al opgehaald");
        dialog.close();
      }
    }
    var progressinterval = setInterval(function()
    {
      if(localStorage.getItem("progress") >99)
      {

        try
        {
          //---------------------------CHECK VOOR UPDATES------------------------------
           var refroutes = firebase.database().ref('flamelink/environments/production/content/version/en-US/appVersion');
           firebase.database().ref(refroutes).once('value', function(snapshot)
           {
             //alert("in de appversion firebase functie");
             var data = snapshot.val();
             //alert("snapshot data = " + data);
             app.dialog.close();
             localStorage.setItem("AppVersion", data); 
             //alert("progress is voltooid");
             clearInterval(progressinterval);
             dialog.close();
             localStorage.setItem("EersteKeerGeladen","true");
             //alert("eerstekeergelanden = TRUE");
           });
         //----------------------------------------------------------------------------
        }
        catch(err)
        {
          alert("eerste keer geladen true && appversion != null: " + err);
          location.reload();
        }



       
      }
    },200);
  }, 100);
  localStorage.setItem("RouteDrawn","initial");
  localStorage.setItem("MapNLInitialised","false");
  //---------------------------------------------------------------------------
}


function Kaart(routePoints)
{
  var mapLoad = "";
  var routeCoordinaten = routePoints;
  if(localStorage.getItem("MapNLInitialised") == "false")
  {
    //mymap.remove();
    mapLoad = "\map/{z}/{x}/{y}.png";
    var mapElementInterval = setInterval(function()
    {  
      var elementExists = document.getElementById("mapid");
      if(elementExists != null) 
      {
        clearInterval(mapElementInterval);
        localStorage.setItem("MapNLInitialised","true");
        console.log("element bestaat");
        //----------------------------------------------------------------------------------------------
        //var mapboxUrl = "https://api.mapbox.com/styles/v1/groenestapstenenvzw/cjsa2ljft5tgs1ftdjcqr09mo/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiZ3JvZW5lc3RhcHN0ZW5lbnZ6dyIsImEiOiJjanMwNzNiN2MwMDhmNGFrdm9pZTlidzhzIn0.9eaZs-fbZSyygtfnyqUEIQ";
        /*leaflet code*/
        mymap = L.map('mapid',
        {
          /*maxBounds: [
              //south west
              [50.680033, 4.313562],
              //north east
              [50.877788, 4.605838]
            ] */
          }).setView([50.791487, 4.448756], 13);
        L.tileLayer(mapLoad, {
        //L.tileLayer('https://api.mapbox.com/styles/v1/groenestapstenenvzw/cjsa2ljft5tgs1ftdjcqr09mo/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiZ3JvZW5lc3RhcHN0ZW5lbnZ6dyIsImEiOiJjanMwNzNiN2MwMDhmNGFrdm9pZTlidzhzIn0.9eaZs-fbZSyygtfnyqUEIQ', {
          maxZoom: 16,
          minZoom: 11,
          tileSize: 512,
          zoomOffset: -1,
        }).addTo(mymap);
        //mymap.on('load', () => console.log(map.getCanvas().toDataURL()));
        
        mymap.locate(
        {
          setView: false, 
          maxZoom: 16, 
          watch:true
        });
        var layerGroup = L.layerGroup();
        //console.log(coords);
        var x = 0;
        //for(var i = 0; i < coords.length; i++) 
        //{
          /*x++
          if(x == 10)
          {
            var rusbroeckMarker = new L.marker([coords[i][0], coords[i][1]]).bindPopup("Dit is een marker op coordinaten " + coords[i][0] + ", " + coords[i][1]);
          layerGroup.addLayer(rusbroeckMarker);
            x = 0;
          }*/
        /* var boomtestcontent =`
          <div class="card demo-card-header-pic">
          <a href="/Event/">
          <div style="background-image:url(https://cdn.framework7.io/placeholder/nature-1000x600-3.jpg)"
            class="card-header align-items-flex-end"></div>
          </a>
          <div class="card-content card-content-padding">
            <p class="date">Speciale boom</p>
            <p>Quisque eget vestibulum nulla. Quisque quis dui quis ex ultricies efficitur vitae non felis. Phasellus
              quis nibh hendrerit...</p>
          </div>
          <!--<div class="card-footer"><a href="#" class="link">Like</a><a href="#" class="link">Read more</a></div>-->
          </div>
          `;
          var coordinatenTestContent = "Dit is een marker op coordinaten " + coords[i][0] + ", " + coords[i][1];
          var rusbroeckMarker = new L.marker([coords[i][0], coords[i][1]]).bindPopup(coordinatenTestContent);
          layerGroup.addLayer(rusbroeckMarker); 
        }*/ 
        var gpx = 'gpx/middenhutwandeling.gpx';
        /*new L.G)PX(gpx, {async: true}).on('loaded', function(e) {
          mymap.fitBounds(e.target.getBounds());
        }).addTo(mymap); */

        var RuusbroeckLine =  L.polyline([[coords]],{color: 'red'});
        layerGroup.addLayer(RuusbroeckLine);
        /*om naar deze specifieke lijn op de map te gaan*/
        //mymap.fitBounds(RuusbroeckLine.getBounds());
        var overlay = 
        {
          'Ruusbroeck': layerGroup,
        }; 
        L.control.layers(null, overlay).addTo(mymap);
        //----------------------------------------------------------------------------------------
      }
      else
      {
        console.log("element bestaat niet");
      }
    }, 200);
  }
  else if(localStorage.getItem("MapNLInitialised") == "true")
  {
    try
    {
      mymap.remove();
    }
    catch(err)
    {
      console.log("verwijderen map : " + err);
    }
    var mapinterval = setInterval(function()
    {
      var mapcontainer = document.getElementById("mapid");
      if(mapcontainer != null)
      {
        clearInterval(mapinterval); 
        mymap = L.map('mapid',
        {
          maxBounds: [
             //south west
             [50.680033, 4.313562],
             //north east
             [50.877788, 4.605838]
           ] 
         }).setView([50.791487, 4.448756], 13);
         
      }
    },100)
    /*
    var internetCheck = setInterval(function()
    {
      if(localStorage.getItem("InternetStatus") == "Online")
      {
        mapLoad = "https://api.mapbox.com/styles/v1/groenestapstenenvzw/cjsa2ljft5tgs1ftdjcqr09mo/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiZ3JvZW5lc3RhcHN0ZW5lbnZ6dyIsImEiOiJjanMwNzNiN2MwMDhmNGFrdm9pZTlidzhzIn0.9eaZs-fbZSyygtfnyqUEIQ";
       L.tileLayer(mapLoad, {
       //L.tileLayer('https://api.mapbox.com/styles/v1/groenestapstenenvzw/cjsa2ljft5tgs1ftdjcqr09mo/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiZ3JvZW5lc3RhcHN0ZW5lbnZ6dyIsImEiOiJjanMwNzNiN2MwMDhmNGFrdm9pZTlidzhzIn0.9eaZs-fbZSyygtfnyqUEIQ', {
        maxZoom: 16,
        minZoom: 12,
        id: 'mapbox://styles/groenestapstenenvzw/cjsa2ljft5tgs1ftdjcqr09mo',
        tileSize: 512,
        zoomOffset: -1,
      }).addTo(mymap);
      }
      else if(localStorage.getItem("InternetStatus") == "Offline")
      {
        mapLoad = "\map/4uMaps/{z}/{x}/{y}.png";
      }
    }, 2000);  
    */
    if(localStorage.getItem("RouteDrawn") =="initial")
    {
      localStorage.setItem("RouteDrawn","false");
    }
    else
    {
      
      if(localStorage.getItem("RouteDrawn") == "true")
      {
        polyline = L.polyline(JSON.parse(localStorage.getItem("polyline"))).addTo(mymap); 
        for(i in mymap._layers) 
        {
          if(mymap._layers[i]._path != undefined) 
          {
            try 
            {
              mymap.removeLayer(mymap._layers[i]);
            }
            catch(e) 
            {
                console.log("problem with " + e + mymap._layers[i]);
            }
          }
        }
        polyline = L.polyline(routeCoordinaten).addTo(mymap); 
        console.log("polyline removed");
      }
      else
      {
        if(routeCoordinaten !=null)
        {
          polyline = L.polyline(routeCoordinaten).addTo(mymap); 
          localStorage.setItem("polyline",JSON.stringify(routeCoordinaten));
          localStorage.setItem("RouteDrawn","true");
          console.log("geen coordinates meegegeven");
        }
        
      } 
    }
  }
}
function routeDivVullen(id)
{
  var savedRoutesContent = [];
  var x = document.getElementsByClassName("soort-wandel");
  for (var i = 0; i < x.length; i++) 
  {
      x[i].style.backgroundColor="";
  }
  var elementId = id;
  if(elementId == "0 wandel")
  {
    document.getElementById(elementId).style.backgroundColor = "#088c34";
  }
  else if(elementId == "1 fiets")
  {
    document.getElementById(elementId).style.backgroundColor = "#ffe43c";
  }
  else if(elementId == "2 paard")
  {
    document.getElementById(elementId).style.backgroundColor = "red";     
  }
  else if(elementId == "3 rolstoel")
  {
      document.getElementById(elementId).style.backgroundColor = "yellow";
  }
  

  savedRoutesContent = RouteContent();
  //savedRoutesContent = JSON.parse(localStorage.getItem())
  var dropDownElementInterval = setInterval(function()
  {
    var e = document.getElementById("poortendropdown");
    if(e != null)
    {
      clearInterval(dropDownElementInterval);
      var geselecteerdeGate= e.options[e.selectedIndex].id;
      var gateNaam = e.options[e.selectedIndex].value;
      localStorage.setItem("GeselecteerdeRouteSoort",typeRoute);
      console.log(id);
      var typeRoute = id.replace(/\D/g,'');
      localStorage.setItem("GeselecteerdeRouteSoort",typeRoute);
      //console.log(gateId);
      var tabRoute = document.getElementById("tab-route");
      tabRoute.innerHTML = "";

      var aantalRoutes = 0;
      for(var i = 0; i < savedRoutesContent.length;i++)
      {
        var content = document.createElement("div");
        var duurRoute = BerekenTijd(savedRoutesContent[i].distance, typeRoute);//-> hier een functie voor maken 
        //console.log(duurRoute);
        content.innerHTML = `
        <div style=" height: 8%; width="width:100%" id=`+savedRoutesContent[i].uniqueName+` onclick="GekozenRoute(this.id)" class ="routeChoice">
        <div class="vl">
        <div class="routechoicetext">
            <p>` + savedRoutesContent[i].uniqueName + `<br>
            ` + gateNaam + `  
            </p>
            <label>
                <i class="icon f7-icons if-not-md"><img src="\img/distance.png"style='height: 100%; width: 100%; object-fit: contain'/></i>
                <i class="icon material-icons md-only"><img src="\img/distance.png" style='height: 100%; width: 100%; object-fit: contain'/></i>
                ` + savedRoutesContent[i].distance + `km
            </label>
            <label>
                <i class="icon f7-icons if-not-md"><img src="\img/timerIcon.png"style='height: 100%; width: 100%; object-fit: contain'/></i>
                <i class="icon material-icons md-only"><img src="\img/timerIcon.png" style='height: 100%; width: 100%; object-fit: contain'/></i>
                ` + duurRoute + `min
            </label>
            <hr>
            </div>
          </div>
        </div>
        `;
        if(savedRoutesContent[i].gateType == geselecteerdeGate)
        {
          if(savedRoutesContent[i].type == typeRoute)
          {
            tabRoute.appendChild(content);
            console.log("toegevoegd");
            var vlElement = document.getElementsByClassName("vl");
            if(elementId == "0 wandel")
            {
                vlElement[vlElement.length-1].style.borderLeft = " 6px solid green";
            }
            else if(elementId == "1 fiets")
            {
                vlElement[vlElement.length-1].style.borderLeft = " 6px solid #ffe43c";
            }
            else if(elementId == "2 paard")
            {
                vlElement[vlElement.length-1].style.borderLeft = " 6px solid red";
            }
            else if(elementId == "3 rolstoel")
            {
                vlElement[vlElement.length-1].style.borderLeft = " 6px solid yellow";
            }
            aantalRoutes ++;
          }
        }
      }
      console.log("aantal routes: " + aantalRoutes );
      if(aantalRoutes == 0)
      {
        var empty = document.createElement('p');
        empty.innerHTML = "Geen routes voor deze combinatie";
        tabRoute.appendChild(empty);
      }
    }
  },200);
}

function RouteContent()
{
  var x = JSON.parse(localStorage.getItem("routeNames"));
  //var routeNames = JSON.parse(localStorage.getItem("routeNames");)
  var content = [];
  for(var i = 0; i< x.length; i++)
  {
    if (localStorage.getItem(x[i]) != null) 
    {
      var localStorageContent = JSON.parse(localStorage.getItem(x[i]));
      //console.log(JSON.stringify(localStorageContent,null,2));
      //localStorageContent = JSON.stringify(localStorageContent);
      content.push(localStorageContent);
      //console.log(localstorageRouteName);
      //window["localstorageRouteName"] = localStorageContent.uniueName;
      //console.log(localstorageRouteName);
    }
  }
  return content;
}
function BerekenTijd(distance, type)
{
  /**
   * formule: Time = Distance / Speed
  */
  var distance = distance;
  var routeType = type;
  var tijd;
  //tijd voor wandelaar
  if(routeType == 0)
  {
    tijd = Math.round(((distance) / 5) * 60);
    return tijd;
  }
  //tijd voor fietser
  else if(routeType == 1)
  {
    tijd = Math.round(((distance) / 15) * 60);
    return tijd;
  }
  //tijd voor paardrijden
  else if(routeType == 2)
  {
    tijd = Math.round(((distance) / 5) * 60);
    return tijd;
  }
  //tijd voor gehandicapten
  else
  {
    tijd = Math.round(((distance) / 5) * 60);
    return tijd;
  }
  
}
function poortChange(id)
{
  var savedRoutesContent = [];
  savedRoutesContent = RouteContent();
  
  var gateNaam = id.value;
  //console.log("poort is: "+ gateNaam);
  var gates = [];
  
  gates = JSON.parse(localStorage.getItem("Gates"));
  var gateID;
  var typeRoute = localStorage.getItem("GeselecteerdeRouteSoort");
  for(var i = 0; i< gates.length;i++)
  {
    var x = gates[i].name.nl;
    if(gateNaam == x)
    {
      //console.log("type" + gates[i].type);
      gateID = gates[i].type;
    }
  }

  var tabRoute = document.getElementById("tab-route");
  tabRoute.innerHTML = "";
  //console.log("route type: " + typeRoute);
  //console.log("GateID: " + gateID);
  var aantalRoutes = 0;
  for(var i = 0; i < savedRoutesContent.length;i++)
  {
    var savedRoutesContentUniqueName = savedRoutesContent[i].uniqueName;
    console.log("uniquename = " + savedRoutesContent[i].uniqueName);
    var content = document.createElement("div");
    var duurRoute = BerekenTijd(savedRoutesContent[i].distance, typeRoute);//-> hier een functie voor maken 
    content.innerHTML = `
    <div style=" height: 8%; width:100%" id=` + savedRoutesContentUniqueName +` onclick="GekozenRoute(this.id)" class ="routeChoice">
    <div class="vl">
    <div class="routechoicetext">
        <p>` + savedRoutesContent[i].uniqueName + `<br>
        ` + gateNaam + `  
        </p>
        <label>
            <i class="icon f7-icons if-not-md"><img src="\img/distance.png"style='height: 100%; width: 100%; object-fit: contain'/></i>
            <i class="icon material-icons md-only"><img src="\img/distance.png" style='height: 100%; width: 100%; object-fit: contain'/></i>
            ` + savedRoutesContent[i].distance + `km
        </label>
        <label>
            <i class="icon f7-icons if-not-md"><img src="\img/timerIcon.png"style='height: 100%; width: 100%; object-fit: contain'/></i>
            <i class="icon material-icons md-only"><img src="\img/timerIcon.png" style='height: 100%; width: 100%; object-fit: contain'/></i>
            ` + duurRoute + `min
        </label>
        <hr>
      </div>
    </div>
    </div>
    `;
    if(savedRoutesContent[i].gateType == gateID)
    {
      if(savedRoutesContent[i].type == typeRoute)
      {
        tabRoute.appendChild(content);
        var vlElement = document.getElementsByClassName("vl");
            if(typeRoute == 0)
            {
                vlElement[vlElement.length-1].style.borderLeft = " 6px solid green";
            }
            else if(typeRoute == 1)
            {
                vlElement[vlElement.length-1].style.borderLeft = " 6px solid #ffe43c";
            }
            else if(typeRoute == 2)
            {
                vlElement[vlElement.length-1].style.borderLeft = " 6px solid red";
            }
            else if(typeRoute == 3)
            {
                vlElement[vlElement.length-1].style.borderLeft = " 6px solid yellow";
            }
        aantalRoutes ++;
      }
    }
  }
  console.log("aantal routes: " + aantalRoutes );
  if(aantalRoutes == 0)
  {
    var empty = document.createElement('p');
    empty.innerHTML = "Geen routes voor deze combinatie";
    tabRoute.appendChild(empty);
  }

}
function GekozenRoute(name)
{
  console.log("route geselecteerd");
  var gekozenRouteName = name;
  var localstorageRoutePoints = gekozenRouteName + "RoutePoints";
  var coords = JSON.parse(localStorage.getItem(localstorageRoutePoints));
  console.log(localstorageRoutePoints);
  //console.log(coords[0]);
  //console.log(coords[1]);
  if(localStorage.getItem("polyline") !=null)
  {
    //polyline = L.polyline(JSON.parse(localStorage.getItem("polyline"))).addTo(mymap); 
    for(i in mymap._layers) 
    {
      if(mymap._layers[i]._path != undefined) 
      {
        try 
        {
          mymap.removeLayer(mymap._layers[i]);
        }
        catch(e) 
        {
            console.log("problem with " + e + mymap._layers[i]);
        }
      }
    }
    console.log("polyline removed");
  }
  for(var i = 0; i < coords.length; i++)
  {
    if(i>0)
    {
      window['polyline' + i] = [[coords[i-1].lat, coords[i-1].lng],[coords[i].lat, coords[i].lng]];
      //console.log(window['polyline' + i]);
      polylineLines.push([[coords[i-1].lat, coords[i-1].lng],[coords[i].lat, coords[i].lng]]);
      //polylineLines.push(window['polyline' + i]);
      window['polyline' + i] = L.polyline( window['polyline' + i]).addTo(mymap); 
      window['polyline' + i].setStyle(
      {
        color: 'orange'
      });
    }
    
    //console.log(coords[i]);
    
  }
  localStorage.setItem("polyline",JSON.stringify(coords));
  polylineCoords = coords;
  //console.log(polylineCoords);
  //Kaart(coords);
}
//var coords = [["50.76752","4.43747"],["50.76752","4.43746"],["50.7675","4.43734"],["50.7675","4.43724"],["50.76751","4.43711"],["50.76765","4.43607"],["50.76781","4.43516"],["50.76784","4.435"],["50.76784","4.43488"],["50.76782","4.43477"],["50.76768","4.43427"],["50.76752","4.43377"],["50.76746","4.43356"],["50.7674","4.4334"],["50.76729","4.43298"],["50.76719","4.43263"],["50.76713","4.43239"],["50.76675","4.43078"],["50.76671","4.4306"],["50.76669","4.43057"],["50.76667","4.43055"],["50.76663","4.43055"],["50.76648","4.43063"],["50.76589","4.431"],["50.76571","4.43124"],["50.76556","4.43151"],["50.76549","4.43161"],["50.76545","4.43178"],["50.76539","4.4319"],["50.76525","4.43206"],["50.7651","4.43208"],["50.76504","4.43209"],["50.76498","4.43213"],["50.76483","4.43221"],["50.76472","4.43208"],["50.76458","4.43195"],["50.76428","4.43185"],["50.76417","4.43184"],["50.76405","4.43183"],["50.76383","4.4318"],["50.76367","4.43182"],["50.76354","4.43183"],["50.76286","4.43194"],["50.7618","4.43217"],["50.76092","4.43233"],["50.76054","4.4324"],["50.76025","4.43246"],["50.75948","4.43262"],["50.75945","4.43254"],["50.75937","4.43233"],["50.75931","4.43218"],["50.75925","4.43203"],["50.7592","4.43191"],["50.75915","4.43176"],["50.75907","4.43157"],["50.75884","4.43097"],["50.75875","4.43072"],["50.7585","4.43008"],["50.7583","4.42957"],["50.75782","4.42832"],["50.7575","4.42749"],["50.75681","4.42569"],["50.75663","4.42568"],["50.75641","4.42566"],["50.75619","4.42564"],["50.75605","4.42563"],["50.75581","4.42562"],["50.75566","4.42561"],["50.75555","4.4256"],["50.75539","4.42559"],["50.75527","4.42558"],["50.75517","4.42557"],["50.75504","4.42556"],["50.75484","4.42555"],["50.75473","4.42555"],["50.75468","4.42554"],["50.75457","4.42554"],["50.75447","4.42553"],["50.7544","4.42553"],["50.75429","4.42552"],["50.75286","4.4254"],["50.75298","4.42501"],["50.75362","4.42299"],["50.75388","4.42217"],["50.75392","4.42205"],["50.75403","4.4217"],["50.75411","4.42159"],["50.75432","4.42149"],["50.75445","4.42147"],["50.75453","4.42146"],["50.75461","4.42145"],["50.75493","4.42132"],["50.7552","4.4212"],["50.75542","4.4211"],["50.75568","4.42099"],["50.75603","4.42086"],["50.75625","4.42087"],["50.7567","4.42098"],["50.757","4.4209"],["50.75764","4.4206"],["50.75769","4.42056"],["50.75807","4.42022"],["50.7584","4.41978"],["50.75858","4.41976"],["50.75941","4.42013"],["50.75981","4.42039"],["50.75995","4.42051"],["50.76006","4.42069"],["50.76061","4.42183"],["50.76084","4.42223"],["50.76122","4.42261"],["50.76133","4.42273"],["50.76146","4.42295"],["50.76154","4.42314"],["50.76165","4.42334"],["50.76186","4.42361"],["50.76192","4.42368"],["50.76206","4.42388"],["50.76223","4.42413"],["50.7624","4.42438"],["50.76251","4.42454"],["50.76264","4.42468"],["50.76281","4.42483"],["50.76292","4.42495"],["50.76312","4.42519"],["50.7633","4.42548"],["50.76346","4.42579"],["50.76363","4.42603"],["50.76368","4.42611"],["50.76373","4.42617"],["50.76376","4.42623"],["50.76381","4.42642"],["50.76383","4.42661"],["50.76384","4.42682"],["50.76387","4.42698"],["50.76392","4.42711"],["50.764","4.4274"],["50.76411","4.42762"],["50.76416","4.42774"],["50.76418","4.42789"],["50.76421","4.42824"],["50.76429","4.42859"],["50.76431","4.42873"],["50.76435","4.42894"],["50.76441","4.42923"],["50.76446","4.4295"],["50.76449","4.42978"],["50.76451","4.43024"],["50.76454","4.43057"],["50.76459","4.43086"],["50.76468","4.43144"],["50.76483","4.43221"],["50.76487","4.43236"],["50.76488","4.43257"],["50.76492","4.43296"],["50.76501","4.4337"],["50.76524","4.43494"],["50.76542","4.43575"],["50.76554","4.43612"],["50.76564","4.43636"],["50.7658","4.43673"],["50.76616","4.43764"],["50.76595","4.43632"],["50.76606","4.43651"],["50.76636","4.43745"],["50.76693","4.43901"],["50.76707","4.4394"],["50.76709","4.43953"],["50.76712","4.43969"],["50.76716","4.44028"],["50.76721","4.44088"],["50.76731","4.44202"],["50.76733","4.44216"],["50.76738","4.44227"],["50.76745","4.44237"],["50.76759","4.44246"],["50.76771","4.44253"],["50.76795","4.44268"],["50.76805","4.44274"],["50.76814","4.44271"],["50.76821","4.44262"],["50.76826","4.44242"],["50.76831","4.44213"],["50.76836","4.44195"],["50.76838","4.44191"],["50.76842","4.4419"],["50.76844","4.44202"],["50.76847","4.44225"],["50.76848","4.44234"],["50.76849","4.44244"],["50.76849","4.44255"],["50.76853","4.44255"],["50.76859","4.44255"],["50.76864","4.44254"],["50.76868","4.44251"],["50.76873","4.44246"],["50.76888","4.44227"],["50.76882","4.44186"],["50.76881","4.44176"],["50.76873","4.44118"],["50.76871","4.44111"],["50.76868","4.44106"],["50.76862","4.44103"],["50.76848","4.44106"],["50.76845","4.44101"],["50.76835","4.44047"],["50.76832","4.44038"],["50.76808","4.4395"],["50.76805","4.4394"],["50.76801","4.43929"],["50.76798","4.43911"],["50.76795","4.43899"],["50.76791","4.43877"],["50.76786","4.43854"],["50.76782","4.43849"],["50.7678","4.43844"],["50.76755","4.43759"]];
$(document).on('page:init', function (e, page) 
{
  var gates = [];
  gates = JSON.parse(localStorage.getItem("Gates"));
   //console.log("interval stopt");
   
   var select = document.getElementById("poortendropdown"); 
   if(select != null)
   {
     //console.log("select element bestaat");
     for(var i = 0; i < gates.length; i++) 
     {
       var opt = gates[i];
       //console.log(opt.name.nl);
       var el = document.createElement("option");
       el.textContent = opt.name.nl;
       el.setAttribute("id", gates[i].type);
       el.setAttribute("value", gates[i].type);
       el.value = opt.name.nl;
       select.appendChild(el);
     }
    var savedRoutesContent = [];

    savedRoutesContent = RouteContent();
    //savedRoutesContent = JSON.parse(localStorage.getItem())
    var dropDownElementInterval = setInterval(function()
    {
      var e = document.getElementById("poortendropdown");
      if(e != null)
      {
        
        clearInterval(dropDownElementInterval);
        document.getElementById("0 wandel").style.backgroundColor = "#088c34";
        var geselecteerdeGate= 0;
        var gateNaam = e.options[e.selectedIndex].value;
        var typeRoute = 0;
        //console.log(gateId);
        var tabRoute = document.getElementById("tab-route");
        tabRoute.innerHTML = "";
        
        
        var aantalRoutes = 0;
        for(var i = 0; i < savedRoutesContent.length;i++)
        {
          var content = document.createElement("div");
          //console.log("routeGateType: " + savedRoutesContent[i].gateType);
          //console.log("routeType: " + savedRoutesContent[i].type);
          var duurRoute = BerekenTijd(savedRoutesContent[i].distance, typeRoute);//-> hier een functie voor maken
          if(savedRoutesContent[i].gateType == 0 && savedRoutesContent[i].type == 0)
          {
            var savedRoutesContentUniqueName = savedRoutesContent[i].uniqueName;
            savedRoutesContentUniqueName = savedRoutesContentUniqueName.replace(/\s/g, "");
            //console.log(savedRoutesContent[i]);
            //console.log(savedRoutesContent[i]);
            content.innerHTML = 
            `
            <div style=" height: 8%; width:100%" id=`+savedRoutesContentUniqueName+` onclick="GekozenRoute(this.id)" class ="routeChoice">
              <div class="vl">
                <div class="routechoicetext">
                    <p>` + savedRoutesContent[i].uniqueName + `<br>
                    ` + gateNaam + `  
                    </p>
                    <label>
                        <i class="icon f7-icons if-not-md"><img src="\img/distance.png"style='height: 100%; width: 100%; object-fit: contain'/></i>
                        <i class="icon material-icons md-only"><img src="\img/distance.png" style='height: 100%; width: 100%; object-fit: contain'/></i>
                        ` + savedRoutesContent[i].distance + `km
                    </label>
                    <label>
                        <i class="icon f7-icons if-not-md"><img src="\img/timerIcon.png"style='height: 100%; width: 100%; object-fit: contain'/></i>
                        <i class="icon material-icons md-only"><img src="\img/timerIcon.png" style='height: 100%; width: 100%; object-fit: contain'/></i>
                        ` + duurRoute + `min
                    </label>
                    <hr>
                  </div>
                </div>
              </div>
            `;
            tabRoute.appendChild(content);
            console.log("bovenstaande data is toegevoegd");
            aantalRoutes ++;
          } 
          //console.log(duurRoute);
        }
        //console.log("aantal routes: " + aantalRoutes );
        if(aantalRoutes == 0)
        {
          var empty = document.createElement('p');
          empty.innerHTML = "Geen routes voor deze combinatie";
          tabRoute.appendChild(empty);
        }
      }
    },200);
  }
  else
  {
  console.log("select element bestaat niet");
  }
});

/*------------------Foto code-------------------------*/
function test()
{
  console.log("oke clicked");
  $("#cameraInput").click();
}
function readURL(input) 
{
  console.log("hey");
  $("#cameraInput").trigger('click');
  if (input.files && input.files[0]) 
  {
    var reader = new FileReader();
    reader.onload = function (e) 
    {
      $('#uploadimage').attr('src', "");
      $('#uploadimage').attr('src', e.target.result);
    };
    reader.readAsDataURL(input.files[0]);
  }
}
function ScriptAndUpdateCheck()
{
  //alert("in de appversion functie");
  InizializeFirebase();
  console.log("in scriptandupdate functie");
  if(localStorage.getItem("firebaseScriptsLoaded") == "true")
  {
    var internetStatus;
    console.log("begininterval");
    internetStatus = localStorage.getItem("InternetStatus");
    //alert("internetstatus:" + internetStatus);
    //alert("eerstekeergeladen:" + localStorage.getItem("EersteKeerGeladen"));
    if(internetStatus == "Online" && localStorage.getItem("EersteKeerGeladen") == null && localStorage.getItem("reloaded") == "false")
    {
      localStorage.setItem("reloaded", "true");
      console.log("in reloaded if");
      location.reload();
    }
    else if(internetStatus == "Online" && localStorage.getItem("EersteKeerGeladen") == null && localStorage.getItem("reloaded") == "true")
    {
      infoOphalen();
      console.log("in infoophalen if");
    }
    /*else if(localStorage.getItem("AppVersion") == null)
    {
      try
      {
        var refroutes = firebase.database().ref('flamelink/environments/production/content/version/en-US/appVersion');
        firebase.database().ref(refroutes).once('value', function(snapshot)
        {
          var data = snapshot.val();
          localStorage.setItem("AppVersion", data);
          app.dialog.close();
        });
      }
      catch(err)
      {
        alert("null appversion: " + err)
      }
     
    }*/
    else if(internetStatus == "Online" && localStorage.getItem("EersteKeerGeladen") == "true" && localStorage.getItem("AppVersion") != null)
    {
      //alert("in de appversion if");
     try
     {
       //---------------------------CHECK VOOR UPDATES------------------------------
        var refroutes = firebase.database().ref('flamelink/environments/production/content/version/en-US/appVersion');
        firebase.database().ref(refroutes).once('value', function(snapshot)
        {
          //alert("in de appversion firebase functie");
          var data = snapshot.val();
          //alert("snapshot data = " + data);
          app.dialog.close();
          if(localStorage.getItem("AppVersion") != data)
          {
            //alert("if voor locale versie te vergelijken met firebase versie");
            if (confirm('Update Beschikbaar')) 
            {
              localStorage.setItem("EersteKeerGeladen","false");
              localStorage.setItem("AppVersion", data);
              //CheckInternet();/*kan misschien verwijderd worden op deze plaats*/
              infoOphalen();
              
            } 
            else 
            {
              app.dialog.close();
            }
          }
        });
      //----------------------------------------------------------------------------
     }
     catch(err)
     {
       alert("eerste keer geladen true && appversion != null: " + err);
       location.reload();
     }
      

     /* ------------------------DISTANCE BEREKENEN----------------------------
      var coordinatesToCalculate = JSON.parse(localStorage.getItem("KoningklijkeWandelingRoutePoints"));
      var punt1;
      var punt2;
      var puntdistance = 0;
      for(var i = 0; i < coordinatesToCalculate.length; i++)
      {
        //console.log(coordinatesToCalculate[i].lat);
        if(i>0)
        {
          punt1 = [JSON.stringify(coordinatesToCalculate[i-1].lat), JSON.stringify(coordinatesToCalculate[i-1].lng)];
          punt2 = [JSON.stringify(coordinatesToCalculate[i].lat), JSON.stringify(coordinatesToCalculate[i].lng)];
          
          var punt1lat = JSON.parse(punt1[0]);
          var punt1lng = JSON.parse(punt1[1]);
          var punt2lat = JSON.parse(punt2[0]);
          var punt2lng = JSON.parse(punt2[1]);
          var rad = function(x) {
            return x * Math.PI / 180;
          };
          var R = 6371000; // Earth’s mean radius in meter
          var dLat = rad(punt2lat - punt1lat);
          var dLong = rad(punt2lng - punt1lng);
          var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(rad(punt1lat)) * Math.cos(rad(punt2lat)) *
            Math.sin(dLong / 2) * Math.sin(dLong / 2);
          var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          var d = R * c;
          puntdistance = puntdistance + d;
          console.log("distance in meter: " + d); // returns the distance in meter
        }
      }
      */
      //console.log("totale distance: " + puntdistance);
    }
    else if(internetStatus == "Offline" && localStorage.getItem("EersteKeerGeladen") == "true")
    {
      app.dialog.close();
    }
  }
  else
  {
    location.reload();
  }
 
}
function locateUser()
{
  if(navigator.geolocation) 
    {
      navigator.geolocation.getCurrentPosition((position)=>
      {
        lat  = position.coords.latitude;
        long = position.coords.longitude;
        //console.log(lat);
        //console.log(long);
      });
    } 
}
var coordinateLocationInArray = 0;
var polylineInterval = setInterval(function()
{
  //locateUser();
  //console.log(polylineLines[0][0])
  //console.log(polylineLines[coordinateLocationInArray]);
  for(var i = 0; i <50; i++)
  {
    /*window["polyline "+ i].setStyle(
      {
        color: 'green'
      });*/
      //console.log(window["polyline" + i]);
  }
  for (var key in window) 
  {
    if(key.includes("polyline"))
    {
      //console.log("window variable-> " + key + ": " + window[key]);
    }
   
  }
},5000);
var current_position, current_accuracy;

function onLocationFound(e) 
{
  // if position defined, then remove the existing position marker and accuracy circle from the map
  console.log("location found");
  console.log(e);

  if (current_position) 
  {
    mymap.removeLayer(current_position);
  }
  if(localStorage.getItem("MapNLInitialised") == "true")
  {
    const latlng = 
    {
      lat: e.coords.latitude,
      lng: e.coords.longitude
    };
    lat = e.coords.latitude;
    long = e.coords.longitude;
    current_position = L.marker(latlng).addTo(mymap);
  }
  
  //---------------------------------------------------------------------------------------
  if(polylineLines != undefined)
  {
    if(polylineLines != "")
    {
      console.log("Coord1 lat = " + polylineLines[coordinateLocationInArray][0][0]);
      console.log("Coord1 long = " + polylineLines[coordinateLocationInArray][0][1]);

      console.log("Coord2 lat = " + polylineLines[coordinateLocationInArray][1][0]);
      console.log("Coord2 long = " + polylineLines[coordinateLocationInArray][1][1]);
      var line = [[polylineLines[coordinateLocationInArray][0][0], polylineLines[coordinateLocationInArray][0][1]], [polylineLines[coordinateLocationInArray][1][0],polylineLines[coordinateLocationInArray][1][1]]];
      
      console.log(window["polyline" + (coordinateLocationInArray+1)]);
      mymap.removeLayer(window["polyline" + (coordinateLocationInArray+1)]);
      window['polyline' + (coordinateLocationInArray+1)] = [[polylineLines[coordinateLocationInArray][0][0], polylineLines[coordinateLocationInArray][0][1]],[polylineLines[coordinateLocationInArray][1][0], polylineLines[coordinateLocationInArray][1][1]]];

      window['polyline' + (coordinateLocationInArray+1)] = L.polyline( window['polyline' + (coordinateLocationInArray+1)],{color: 'lightgreen'}).addTo(mymap); 
      coordinateLocationInArray ++;
      /*
      window['polyline' + (coordinateLocationInArray+1)].setStyle(
      {
        color: 'green'
      });
      */



      /*console.log("polylineLines = " + polylineLines[0][0]);
      console.log("yes");
      console.log("lat = " + lat);
      console.log("long = " + long);
      */
      /*if(polylineLines[coordinateLocationInArray][1][0] == lat && polylineLines[coordinateLocationInArray][1][1] == long)
      {
        console.log("lng: " + polylineLines[coordinateLocationInArray][1][1] + "lat" + polylineLines[coordinateLocationInArray][1][0]);
        console.log(coordinateLocationInArray);
        

      }
      if(polylineCoords[coordinateLocationInArray].lng == long && polylineCoords[coordinateLocationInArray].lat == lat)
      {
        console.log("lng: " + polylineCoords[coordinateLocationInArray].lng + "lat" + polylineCoords[coordinateLocationInArray].lat);
        console.log(coordinateLocationInArray);
        coordinateLocationInArray ++;
      }
      else
      {
        console.log("volgende coordinaten niet bereikt dus blijft bij: " + coordinateLocationInArray);
        //console.log("lng: " + polylineCoords[coordinateLocationInArray].lng + "lat" + polylineCoords[coordinateLocationInArray].lat);
        //coordinateLocationInArray ++;
      }*/
    }
    //kijken of de gebruiker op de bepaalde coordinaten is om de polyline achter hem groen te maken
    
  }
  else
  {
    console.log("geen coordinates");
  }
  //--------------------------------------------------------------------------------------------------

}


function onLocationError(e) {
  console.log("Location error: " + e);
}

navigator.geolocation.watchPosition(onLocationFound, onLocationError, {
  maximumAge: 1000,
  timeout: 2000
});
