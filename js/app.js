// Dom7
var $ = Dom7;
// Theme
var theme = 'auto';
if (document.location.search.indexOf('theme=') >= 0) 
{
  theme = document.location.search.split('theme=')[1].split('&')[0];
}
localStorage.setItem("firebaseScriptsLoaded","false");
if(localStorage.getItem("GeselecteerdeTaal")== undefined)
{
  localStorage.setItem("GeselecteerdeTaal","NL")
}
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
  if(localStorage.getItem("GeselecteerdeTaal") == "NL")
  {
    app.views.main.router.navigate("/");
  }
  else if(localStorage.getItem("GeselecteerdeTaal") == "FR")
  {
    app.views.main.router.navigate("/index-fr/");
  }
  else if(localStorage.getItem("GeselecteerdeTaal") == "ENG")
  {
    console.log("engels geselecteerd");
    app.views.main.router.navigate("/index-eng/");
  }
  localStorage.setItem("Framework7Initialised", "true");
  localStorage.setItem("Reverse","false");
  localStorage.setItem("RouteStart","false");
}
catch(err)
{
  console.log(" initialize framework7: " + err);
} 
document.addEventListener("backbutton", onBackKeyDown, false);

function onBackKeyDown() {
    // Handle the back button
}

/*localforage.getItem('HeritageDeHangar', function(err, value) 
{
   console.log(value) 
   var canvass = document.getElementById("heritageTest");
   canvass.setAttribute("src",value.imagename);
});
*/
/*firebase initialisation*/
var firebaseConfig, database, storage, mymapNL, mymapFR, mymapENG, polylineCoords, lat, long, polyline, coords, current_position, current_accuracy, punt1Lat, punt1Lng, punt2Lat, punt2Lng;
var polylineLines = [];
var polylineNames = [];
var totaldistance = 0;
var TotaleDuurRoute,ResterendeDuurRoute,GekozenRouteDistance, GekozenRouteType,DuurPerPolyline, greenIcon,StartMarker,HeritageIcon,GateIcon, publicTransportIcon, parkingIcon, horecaIcon, fietsParkingIcon, aantalHeritages;
var time = 0;
var HeritageNames = [];
var heritageLayer = [];
var request,db;
var HeritageObjects = [];
var hasNumber = /\d/;
if(localStorage.getItem("indexedDB") == undefined)
{
  // Let us open our database
  request = indexedDB.open("Heritage",1);
  localStorage.setItem("indexedDB","true");
  request.onerror = function(event) 
  {
    console.log("db error");
  };
  request.onsuccess = function(event) 
  {
    console.log("db aangemaakt");
    db = request.result;
  };
  request.onupgradeneeded = function(event)
  {
    console.log("upgrade called");
    db = request.result;
    db.createObjectStore("Heritage_images",{keyPath : "Title"});
  };
}
StartIcon = L.icon(
{
  iconUrl: '\img/start-flag.png',
  iconSize:     [30, 85], // size of the icon
  iconAnchor:   [0, 85], // point of the icon which will correspond to marker's location
});
HeritageIcon = L.icon(
{
  iconUrl: '\img/building.png',
  iconSize:     [20, 30], // size of the icon
  iconAnchor:   [0, 30], // point of the icon which will correspond to marker's location
});
  
GateIcon = L.icon(
{
  iconUrl: '\img/gate.png',
  iconSize:     [20, 30], // size of the icon
  iconAnchor:   [10, 30], // point of the icon which will correspond to marker's location
});
publicTransportIcon = L.icon(
{
  iconUrl: '\img/publicTransport.png',
  iconSize:     [20, 30], // size of the icon
  iconAnchor:   [10, 30], // point of the icon which will correspond to marker's location
});
parkingIcon = L.icon(
{
  iconUrl: '\img/parking.png',
  iconSize:     [20, 30], // size of the icon
  iconAnchor:   [10, 30], // point of the icon which will correspond to marker's location
});
horecaIcon = L.icon(
{
  iconUrl: '\img/horeca.png',
  iconSize:     [20, 30], // size of the icon
  iconAnchor:   [10, 30], // point of the icon which will correspond to marker's location
});
fietsParkingIcon = L.icon(
{
  iconUrl: '\img/fietsParking.png',
  iconSize:     [30, 40], // size of the icon
  iconAnchor:   [10, 40], // point of the icon which will correspond to marker's location
});


app.dialog.preloader();
Setup();

function Setup()
{
  localStorage.setItem("MapNLInitialised","false");
  localStorage.setItem("MapFRInitialised","false");
  localStorage.setItem("MapENGInitialised","false");
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
          //console.log("oke laad scripts");
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
      //console.log("niet null");
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
        var refHeritage = firebase.database().ref('flamelink/environments/production/content/heritage/en-US');
        refHeritage.on("value", function(heritagenapshot) 
        {
          x = x + heritagenapshot.numChildren();
          var refPublicTransport = firebase.database().ref('flamelink/environments/production/content/publicTransport/en-US');
          refPublicTransport.on("value", function(publicTransportSnapshot) 
          {
            x = x + publicTransportSnapshot.numChildren();
            var refParkings = firebase.database().ref('flamelink/environments/production/content/parkings/en-US');
            refParkings.on("value", function(parkingsSnapshot) 
            {
              x = x + parkingsSnapshot.numChildren();
              var refHoreca = firebase.database().ref('flamelink/environments/production/content/horeca/en-US');
              refHoreca.on("value", function(horecaSnapshot) 
              {
                x = x + horecaSnapshot.numChildren();
                var refBikeParkings = firebase.database().ref('flamelink/environments/production/content/bikeParkings/en-US');
                refBikeParkings.on("value", function(BikeParkingsSnapshot) 
                {
                  x = x + BikeParkingsSnapshot.numChildren();
                  localStorage.setItem("aantalAssets",x);
                });
              });
            });
          });
        });
      });
    });
  }
  catch(err) 
  {
    console.log("aantal assets: " + err.message);
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
      location.reload();
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
  var heritageName
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
      //console.log("berekenprogress = " + berekenProgress);
      //console.log("aantal assets: " + aantalAssets);
      //console.log("aantal assets = " + aantalAssets);
      
      if(localStorage.getItem("EersteKeerGeladen") == null)
      {
        //alert("het is null");
        localStorage.setItem("EersteKeerGeladen","false");
      }
      if(localStorage.getItem("EersteKeerGeladen") == "false")
      {
        if(localStorage.getItem("db") != undefined)
        {
          db = localStorage.getItem("db");
          console.log("db = " + JSON.stringify(db));
        }
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
                //console.log("gates progress:" + progress);
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
              //localStorage.setItem(value.uniqueName, JSON.stringify(value));
              //-----------------------Excel fetch----------------------------------------------
              var url = value.routePoints;
              try
              {
                /*
                fetch(
                  url,
                  { method: 'GET' }
                )
                .then( response => response)
                .then( json => console.log(json) )
                .catch( error => console.log('error:', error) );
                */
               /*var xhr = new XMLHttpRequest();
               xhr.open("GET", url, true);
               xhr.onload = function (e) 
               {
                if (xhr.readyState === 4) 
                {
                  if (xhr.status === 200) 
                  {
                    console.log("gelukt");
                    //console.log(xhr.responseText);
                  } 
                  else 
                  {
                    console.error(xhr.statusText);
                  }
                }
               };
               xhr.onerror = function (e) {
                console.error(xhr.statusText);
              };
              xhr.send(null); 
              */

                /* set up async GET request */
                var req = new XMLHttpRequest();
               
                req.responseType = "arraybuffer";
                
                req.onload = function(e) 
                {
                  try
                  {
                    var data = new Uint8Array(req.response);
                    var workbook = XLSX.read(data, {type:"array"});
                 
                    /* DO SOMETHING WITH workbook HERE */
                    var numberOfSheets = workbook.SheetNames.length;
                  }
                  catch(err)
                  {
                    alert("excel sheets error" + err);
                  }
                  for (var i = 0; i < numberOfSheets; i++) 
                  {
                    //console.log("ingeladen route: " + value.uniqueName);  
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
                      value.distance = (RouteDistanceBerekenen(obj)/ 1000).toFixed(2);
                      //console.log(obj);
                      localStorage.setItem(uniqueName + "RoutePoints",JSON.stringify(obj,null,2));
                      localStorage.setItem(value.uniqueName, JSON.stringify(value));
                    }
                    catch(err)
                    {
                      alert("dialog en routepoints localstorage: " + err);
                    }
                  }
                  //alert( geladenAssets+ " routes opgehaald");
                 
                  //console.log(value.uniqueName +"RoutePoints");
                };
                req.open("GET", url, true);
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
        try
        {
          var refHeritage = firebase.database().ref('flamelink/environments/production/content/heritage/en-US');
          firebase.database().ref(refHeritage).once('value', function(snapshot)
          {
            console.log("aantal heritages : " + snapshot.numChildren());
            
            aantalHeritages = snapshot.numChildren();
            //alert("in de firebase.on voor laatste assets");
            snapshot.forEach(function(childSnapshot)  
            {
              progress = progress + berekenProgress;
              localStorage.setItem("progress",progress);
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
              //alert("in de foreach voor laatste assets");
              var value = childSnapshot.val();
              for (var key of Object.keys(value)) 
              {
                if(key == "__meta__")
                {
                  //console.log(key + " -> " + x[key]);
                  delete value[key];
                }
                if(key == "image")
                {
                  //console.log(key + " -> " + x[key]);
                  delete value[key];
                }
                // console.log(key + " -> " + x[key]);
              }
              //console.log("heritage : " + JSON.stringify(value,null,2));
              
              if(value.imagename == "")
              {

                console.log("deze heritage is leeg= ");
              }
              else
              {
                var sourceImage = new Image(); sourceImage.crossOrigin="anonymous";
                sourceImage.onload = function() 
                {
                    // Create a canvas with the desired dimensions
                    var canvas = document.getElementById("heritageImage");
                    canvas.width = 320;
                    canvas.height = 180;
            
                    // Scale and draw the source image to the canvas
                    canvas.getContext("2d").drawImage(sourceImage, 0, 0, 320, 180);
            
                    // Convert the canvas to a data URL in PNG format
                    callback(canvas.toDataURL());
                    //console.log(canvas.toDataURL());
                }
                function callback(x)
                {
                  value.imagename = x;
                  //console.log(value.name.nl + ":" + x);
                  heritageName = value.name.nl;
                  heritageName = heritageName.replace(/\s/g, "");
                  HeritageNames.push(heritageName);
                  //console.log("heritageNames = " + HeritageNames);
                  localStorage.setItem("HeritageNames", JSON.stringify(HeritageNames));
                  HeritageObjects.push(value);
                  
                }
                sourceImage.src = value.imagename;
                dialog.setText("Asset " + geladenAssets + " of " + aantalAssets+ " loaded");
              }
            });
          });
        }
        catch(err)
        {
          console.log("heritage error:" + err);
        }
        //----------------------------Data over publicTransport ophalen-------------------------------------------------
        var publicTransport = [];
        try
        {
          //alert("gates ophalen");
          var refPublicTransport = firebase.database().ref('flamelink/environments/production/content/publicTransport/en-US');
          refPublicTransport.on("value", function(publicTransportSnapshot) 
          {
            if(publicTransportSnapshot.exists()) 
            {
              //console.log("aantal children : " + snapshot.numChildren());
              publicTransportSnapshot.forEach(function(childSnapshot)  
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
                publicTransport.push(childData);
                //console.log(childData);
                progress = progress + berekenProgress;
                localStorage.setItem("progress",progress);
                //console.log("gates progress:" + progress);
                dialog.setProgress(localStorage.getItem("progress"));
                geladenAssets = geladenAssets + 1;
                localStorage.setItem("geladenAssets", geladenAssets);
                dialog.setText("Asset " + geladenAssets + " of " + aantalAssets+ " loaded");
              });
              localStorage.setItem("publicTransport",JSON.stringify(publicTransport));
            }
            else 
            {
              console.log("No data available");
            } 
          });
        }
        catch(err)
        {
          console.log("publicTransport error: " + err);
        }
        //----------------------------Data over Parkings ophalen-------------------------------------------------
        var Parkings = [];
        try
        {
          //alert("gates ophalen");
          var refParkings = firebase.database().ref('flamelink/environments/production/content/parkings/en-US');
          refParkings.on("value", function(ParkingsSnapshot) 
          {
            if(ParkingsSnapshot.exists()) 
            {
              //console.log("aantal children : " + snapshot.numChildren());
              ParkingsSnapshot.forEach(function(childSnapshot)  
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
                Parkings.push(childData);
                //console.log(childData);
                progress = progress + berekenProgress;
                localStorage.setItem("progress",progress);
                //console.log("gates progress:" + progress);
                dialog.setProgress(localStorage.getItem("progress"));
                geladenAssets = geladenAssets + 1;
                localStorage.setItem("geladenAssets", geladenAssets);
                dialog.setText("Asset " + geladenAssets + " of " + aantalAssets+ " loaded");
              });
              localStorage.setItem("Parkings",JSON.stringify(Parkings));
            }
            else 
            {
              console.log("No data available");
            } 
          });
        }
        catch(err)
        {
          console.log("Parkings error: " + err);
        }
        //----------------------------Data over Horeca ophalen-------------------------------------------------
        var Horeca = [];
        try
        {
          //alert("gates ophalen");
          var refHoreca = firebase.database().ref('flamelink/environments/production/content/horeca/en-US');
          refHoreca.on("value", function(HorecaSnapshot) 
          {
            if(HorecaSnapshot.exists()) 
            {
              //console.log("aantal children : " + snapshot.numChildren());
              HorecaSnapshot.forEach(function(childSnapshot)  
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
                Horeca.push(childData);
                //console.log(childData);
                progress = progress + berekenProgress;
                localStorage.setItem("progress",progress);
                //console.log("gates progress:" + progress);
                dialog.setProgress(localStorage.getItem("progress"));
                geladenAssets = geladenAssets + 1;
                localStorage.setItem("geladenAssets", geladenAssets);
                dialog.setText("Asset " + geladenAssets + " of " + aantalAssets+ " loaded");
              });
              localStorage.setItem("Horeca",JSON.stringify(Horeca));
            }
            else 
            {
              console.log("No data available");
            } 
          });
        }
        catch(err)
        {
          console.log("Horeca error: " + err);
        }
        //----------------------------Data over BikeParkings ophalen-------------------------------------------------
        var BikeParkings = [];
        try
        {
          //alert("gates ophalen");
          var refHoreca = firebase.database().ref('flamelink/environments/production/content/bikeParkings/en-US');
          refHoreca.on("value", function(HorecaSnapshot) 
          {
            if(HorecaSnapshot.exists()) 
            {
              //console.log("aantal children : " + snapshot.numChildren());
              HorecaSnapshot.forEach(function(childSnapshot)  
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
                BikeParkings.push(childData);
                //console.log(childData);
                progress = progress + berekenProgress;
                localStorage.setItem("progress",progress);
                //console.log("gates progress:" + progress);
                dialog.setProgress(localStorage.getItem("progress"));
                geladenAssets = geladenAssets + 1;
                localStorage.setItem("geladenAssets", geladenAssets);
                dialog.setText("Asset " + geladenAssets + " of " + aantalAssets+ " loaded");
              });
              localStorage.setItem("BikeParkings",JSON.stringify(BikeParkings));
            }
            else 
            {
              console.log("No data available");
            } 
          });
        }
        catch(err)
        {
          console.log("Horeca error: " + err);
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
var heritageInterval = setInterval( function()
{
  if(HeritageObjects.length == aantalHeritages)
  {
    clearInterval(heritageInterval);
    var DBOpenRequest = window.indexedDB.open("Heritage", 4);
    DBOpenRequest.onsuccess = function(event) 
    {
    
      // store the result of opening the database in the db variable.
      // This is used a lot below
      db = DBOpenRequest.result;
    
      // Run the addData() function to add the data to the database
      addData();
    };

  }
},100);

function addData()
{
  var transaction = db.transaction("Heritage_images", "readwrite");
  var objectStore = transaction.objectStore("Heritage_images");
  for(var i = 0; i< aantalHeritages; i++)
  {
    var value = HeritageObjects[i];
    //console.log("HeritageObjects[i] = " + JSON.stringify(HeritageObjects[i]));
    var note = 
    {
    Title: HeritageNames[i],
    value
    }
    var objectStoreRequest = objectStore.add(note);
  }
  
  objectStoreRequest.onsuccess = function(event) {
    // report the success of the request (this does not mean the item
    // has been stored successfully in the DB - for that you need transaction.onsuccess)
  };
  transaction.onsuccess = function(event)
  {
    console.log("TRANSACTION SUCCESSFULL");
  } 
  /*var tx = db.transaction("Heritage_images","readwrite");
  // Now store is available to be populated
  var heritageInfo = tx.objectStore("Heritage_images");
  heritageInfo.add(note);
  */

  //console.log("db = " + db);

}

function Kaart()
{
  if(localStorage.getItem("GeselecteerdeTaal") == "NL")
  {

    var mapLoad = "";
    //mymap.remove();
    mapLoad = "\map/{z}/{x}/{y}.png";
    //mapLoad = "https://api.mapbox.com/styles/v1/groenestapstenenvzw/cjsa2ljft5tgs1ftdjcqr09mo/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiZ3JvZW5lc3RhcHN0ZW5lbnZ6dyIsImEiOiJjanMwNzNiN2MwMDhmNGFrdm9pZTlidzhzIn0.9eaZs-fbZSyygtfnyqUEIQ";
    var mapElementInterval = setInterval(function()
    {  
      var elementExists = document.getElementById("mapidNL");
      if(elementExists != null) 
      {
        try
        {
          mymapNL.remove();
          console.log("map removed");
        }
        catch(err)
        {
          console.log(err);
        }
        clearInterval(mapElementInterval);
        localStorage.setItem("MapNLInitialised","true");
        console.log("element bestaat");
        //----------------------------------------------------------------------------------------------
        //var mapboxUrl = "https://api.mapbox.com/styles/v1/groenestapstenenvzw/cjsa2ljft5tgs1ftdjcqr09mo/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiZ3JvZW5lc3RhcHN0ZW5lbnZ6dyIsImEiOiJjanMwNzNiN2MwMDhmNGFrdm9pZTlidzhzIn0.9eaZs-fbZSyygtfnyqUEIQ";
        mymapNL = L.map('mapidNL',
        {
        }).setView([50.791487, 4.448756], 13);
        L.tileLayer(mapLoad, {
        //L.tileLayer('https://api.mapbox.com/styles/v1/groenestapstenenvzw/cjsa2ljft5tgs1ftdjcqr09mo/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiZ3JvZW5lc3RhcHN0ZW5lbnZ6dyIsImEiOiJjanMwNzNiN2MwMDhmNGFrdm9pZTlidzhzIn0.9eaZs-fbZSyygtfnyqUEIQ', {
          maxZoom: 16,
          minZoom: 11,
          tileSize: 512,
          zoomOffset: -1,
        }).addTo(mymapNL);
        //mymap.on('load', () => console.log(map.getCanvas().toDataURL()));
        mymapNL.locate(
        {
          setView: false, 
          maxZoom: 16, 
          watch:true
        });
        var heritageLayerGroup = L.layerGroup();
        //console.log(coords);
        var DBOpenRequest = window.indexedDB.open("Heritage", 4);
        DBOpenRequest.onsuccess = function(event) 
        {
          db = DBOpenRequest.result;
          //console.log("db = " + db);
          var tx = db.transaction("Heritage_images","readonly");
          var opgehaaldeHeritage = tx.objectStore("Heritage_images");
          var request = opgehaaldeHeritage.getAll();
          request.onsuccess = function(evt) 
          {  
            // Extract all the objects from the event.target.result
          
            var cursor = evt.target.result;
            //console.log(cursor[1].value.imagename);
            for(var i = 0; i< cursor.length;i++)
            {
              var boomtestcontent =`
              <div class="card demo-card-header-pic">
                <div style="background-image:url(` + cursor[i].value.imagename +`)"
                  class="card-header align-items-flex-end">
                </div>
                <div class="card-content card-content-padding">
                  <p class="date">` + cursor[i].value.name.nl +`</p>
                  <p>` +cursor[i].value.longtext.nl +`</p>
                </div>
              </div>
              `;
              var marker = new L.marker([cursor[i].value.latitude, cursor[i].value.longitude], {icon: HeritageIcon}).bindPopup(boomtestcontent);
              heritageLayerGroup.addLayer(marker);
            }
            
            
            
            //console.log("Heritage info = " + JSON.stringify(cursor.value,null,2));
            //cursor.continue();
          }
        }
        var gatesLayerGroup = L.layerGroup();
        var gatesInfo = JSON.parse(localStorage.getItem("Gates"));
        for(var i = 0; i<gatesInfo.length; i++)
        {
          var heritageContent =`
              
                <p>` + gatesInfo[i].name.nl +`</p>
                <p>` + gatesInfo[i].description.nl +`</p>
              `;
          //console.log("Gate " + [i] + "= " + JSON.stringify(gatesInfo[i],null,2));
          var marker = new L.circle([gatesInfo[i].latitude, gatesInfo[i].longitude], 
            {
              color: "green",
              icon: HeritageIcon,
              fillOpacity : 0,
              radius: 500
          }).bindPopup(heritageContent);
          //var gateMarker = new L.marker([gatesInfo[i].latitude, gatesInfo[i].longitude], {icon: GateIcon}).bindPopup(heritageContent);
          gatesLayerGroup.addLayer(marker);
        }

        var publicTransportLayerGroup = L.layerGroup();
        var publicTransportInfo = JSON.parse(localStorage.getItem("publicTransport"));
        for(var i = 0; i<publicTransportInfo.length; i++)
        {
          var publicTransportInfoContent =`
          <p>` + publicTransportInfo[i].description.nl +`</p>
        `;
          var publicTransportInfoMarker = new L.marker([publicTransportInfo[i].latitude, publicTransportInfo[i].longitude], {icon: publicTransportIcon}).bindPopup(publicTransportInfoContent);
          publicTransportLayerGroup.addLayer(publicTransportInfoMarker);
        }

        var ParkingLayerGroup = L.layerGroup();
        var ParkingInfo = JSON.parse(localStorage.getItem("Parkings"));
        for(var i = 0; i<ParkingInfo.length; i++)
        {
          var ParkingInfoContent =`
          <p>` + ParkingInfo[i].description.nl +`</p>
        `;
          var ParkingInfoMarker = new L.marker([ParkingInfo[i].latitude, ParkingInfo[i].longitude], {icon: parkingIcon}).bindPopup(ParkingInfoContent);
          ParkingLayerGroup.addLayer(ParkingInfoMarker);
        }
        
        var HorecaLayerGroup = L.layerGroup();
        var HorecaInfo = JSON.parse(localStorage.getItem("Horeca"));
        for(var i = 0; i<HorecaInfo.length; i++)
        {
          var HorecaInfoContent =`
          <p>` + HorecaInfo[i].name.nl +`</p>
        `;
          var HorecaInfoMarker = new L.marker([HorecaInfo[i].latitude, HorecaInfo[i].longitude], {icon: horecaIcon}).bindPopup(HorecaInfoContent);
          HorecaLayerGroup.addLayer(HorecaInfoMarker);
        }

        var BikeParkingLayerGroup = L.layerGroup();
        var BikeParkingInfo = JSON.parse(localStorage.getItem("BikeParkings"));
        for(var i = 0; i<BikeParkingInfo.length; i++)
        {
          var BikeParkingInfoContent =`
          <p>` + BikeParkingInfo[i].name.nl +`<br>
          ` + BikeParkingInfo[i].description.nl +`</p>
        `;
          var BikeParkingInfoMarker = new L.marker([BikeParkingInfo[i].latitude, BikeParkingInfo[i].longitude], {icon: fietsParkingIcon}).bindPopup(BikeParkingInfoContent);
          BikeParkingLayerGroup.addLayer(BikeParkingInfoMarker);
        }

        var overlay = 
        {
          'Erfgoed': heritageLayerGroup,
          'Poorten': gatesLayerGroup,
          'Openbaar Vervoer' : publicTransportLayerGroup,
          'Parkings' : ParkingLayerGroup,
          'Horeca' : HorecaLayerGroup,
          'Fietsen parking' : BikeParkingLayerGroup
        }; 
        L.control.layers(null, overlay).addTo(mymapNL);
        //----------------------------------------------------------------------------------------
      }
      else
      {
        console.log("element bestaat niet");
      }
    }, 200);
    
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
  }

  else if(localStorage.getItem("GeselecteerdeTaal") == "FR")
  {
    console.log("in franse deel");
    var mapLoad = "";
    console.log("in remove deel");
    //mymap.remove();
    mapLoad = "\map/{z}/{x}/{y}.png";
    var mapElementInterval = setInterval(function()
    {  
      console.log("zoeken naar franse map id");
      var elementExists = document.getElementById("mapidFR");
      if(elementExists != null) 
      {
        try
        {
          mymap.remove();
        }
        catch(err)
        {
          console.log(err);
        }
        
        clearInterval(mapElementInterval);
        localStorage.setItem("MapFRInitialised","true");
        console.log("element bestaat");
        //----------------------------------------------------------------------------------------------
        //var mapboxUrl = "https://api.mapbox.com/styles/v1/groenestapstenenvzw/cjsa2ljft5tgs1ftdjcqr09mo/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiZ3JvZW5lc3RhcHN0ZW5lbnZ6dyIsImEiOiJjanMwNzNiN2MwMDhmNGFrdm9pZTlidzhzIn0.9eaZs-fbZSyygtfnyqUEIQ";
        mymapFR = L.map('mapidFR',
        {
          maxBounds: [
              //south west
              [50.680033, 4.313562],
              //north east
              [50.877788, 4.605838]
            ] 
          }).setView([50.791487, 4.448756], 13);
        L.tileLayer(mapLoad, {
        //L.tileLayer('https://api.mapbox.com/styles/v1/groenestapstenenvzw/cjsa2ljft5tgs1ftdjcqr09mo/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiZ3JvZW5lc3RhcHN0ZW5lbnZ6dyIsImEiOiJjanMwNzNiN2MwMDhmNGFrdm9pZTlidzhzIn0.9eaZs-fbZSyygtfnyqUEIQ', {
          maxZoom: 16,
          minZoom: 11,
          tileSize: 512,
          zoomOffset: -1,
        }).addTo(mymapFR);
        //mymap.on('load', () => console.log(map.getCanvas().toDataURL()));
        
        mymapFR.locate(
        {
          setView: false, 
          maxZoom: 16, 
          watch:true
        });
        var heritageLayerGroup = L.layerGroup();
        //console.log(coords);
        var DBOpenRequest = window.indexedDB.open("Heritage", 4);
        DBOpenRequest.onsuccess = function(event) 
        {
          db = DBOpenRequest.result;
          //console.log("db = " + db);
          var tx = db.transaction("Heritage_images","readonly");
          var opgehaaldeHeritage = tx.objectStore("Heritage_images");
          var request = opgehaaldeHeritage.getAll();
          request.onsuccess = function(evt) 
          {  
            // Extract all the objects from the event.target.result
          
            var cursor = evt.target.result;
            //console.log(cursor[1].value.imagename);
            for(var i = 0; i< cursor.length;i++)
            {
              var boomtestcontent =`
              <div class="card demo-card-header-pic">
                <div style="background-image:url(` + cursor[i].value.imagename +`)"
                  class="card-header align-items-flex-end">
                </div>
                <div class="card-content card-content-padding">
                  <p class="date">` + cursor[i].value.name.fr +`</p>
                  <p>` +cursor[i].value.longtext.fr +`</p>
                </div>
              </div>
              `;
              var marker = new L.marker([cursor[i].value.latitude, cursor[i].value.longitude], {icon: HeritageIcon}).bindPopup(boomtestcontent);
              heritageLayerGroup.addLayer(marker);
            }
            
          
            
            //console.log("Heritage info = " + JSON.stringify(cursor.value,null,2));
            //cursor.continue();
          }
        }
        var gatesLayerGroup = L.layerGroup();
        var gatesInfo = JSON.parse(localStorage.getItem("Gates"));
        for(var i = 0; i<gatesInfo.length; i++)
        {
          var heritageContent =`
              
                <p>` + gatesInfo[i].name.fr +`</p>
                <p>` + gatesInfo[i].description.fr +`</p>
              `;
          //console.log("Gate " + [i] + "= " + JSON.stringify(gatesInfo[i],null,2));
          var marker = new L.circle([gatesInfo[i].latitude, gatesInfo[i].longitude], 
            {
              color: "green",
              icon: HeritageIcon,
              fillOpacity : 0,
              radius: 500
          }).bindPopup(heritageContent);
          var gateMarker = new L.marker([gatesInfo[i].latitude, gatesInfo[i].longitude], {icon: GateIcon}).bindPopup(heritageContent);
          gatesLayerGroup.addLayer(marker);
        }
        var publicTransportLayerGroup = L.layerGroup();
        var publicTransportInfo = JSON.parse(localStorage.getItem("publicTransport"));
        for(var i = 0; i<publicTransportInfo.length; i++)
        {
          var publicTransportInfoContent =`
                <p>` + publicTransportInfo[i].description.fr +`</p>
              `;
          var publicTransportInfoMarker = new L.marker([publicTransportInfo[i].latitude, publicTransportInfo[i].longitude], {icon: publicTransportIcon}).bindPopup(publicTransportInfoContent);
         
          publicTransportLayerGroup.addLayer(publicTransportInfoMarker);
        }
        var publicTransportLayerGroup = L.layerGroup();
        var publicTransportInfo = JSON.parse(localStorage.getItem("publicTransport"));
        for(var i = 0; i<publicTransportInfo.length; i++)
        {
          var publicTransportInfoContent =`
          <p>` + publicTransportInfo[i].description.fr +`</p>
        `;
          var publicTransportInfoMarker = new L.marker([publicTransportInfo[i].latitude, publicTransportInfo[i].longitude], {icon: publicTransportIcon}).bindPopup(publicTransportInfoContent);
          publicTransportLayerGroup.addLayer(publicTransportInfoMarker);
        }

        var ParkingLayerGroup = L.layerGroup();
        var ParkingInfo = JSON.parse(localStorage.getItem("Parkings"));
        for(var i = 0; i<ParkingInfo.length; i++)
        {
          var ParkingInfoContent =`
          <p>` + ParkingInfo[i].description.fr +`</p>
        `;
          var ParkingInfoMarker = new L.marker([ParkingInfo[i].latitude, ParkingInfo[i].longitude], {icon: parkingIcon}).bindPopup(ParkingInfoContent);
          ParkingLayerGroup.addLayer(ParkingInfoMarker);
        }
        
        var HorecaLayerGroup = L.layerGroup();
        var HorecaInfo = JSON.parse(localStorage.getItem("Horeca"));
        for(var i = 0; i<HorecaInfo.length; i++)
        {
          var HorecaInfoContent =`
          <p>` + HorecaInfo[i].name.fr +`</p>
        `;
          var HorecaInfoMarker = new L.marker([HorecaInfo[i].latitude, HorecaInfo[i].longitude], {icon: horecaIcon}).bindPopup(HorecaInfoContent);
          HorecaLayerGroup.addLayer(HorecaInfoMarker);
        }

        var BikeParkingLayerGroup = L.layerGroup();
        var BikeParkingInfo = JSON.parse(localStorage.getItem("BikeParkings"));
        for(var i = 0; i<BikeParkingInfo.length; i++)
        {
          var BikeParkingInfoContent =`
          <p>` + BikeParkingInfo[i].name.fr +`<br>
          ` + BikeParkingInfo[i].description.fr +`</p>
        `;
          var BikeParkingInfoMarker = new L.marker([BikeParkingInfo[i].latitude, BikeParkingInfo[i].longitude], {icon: fietsParkingIcon}).bindPopup(BikeParkingInfoContent);
          BikeParkingLayerGroup.addLayer(BikeParkingInfoMarker);
        }
        var overlay = 
        {
          'Patrimoine': heritageLayerGroup,
          'Portes': gatesLayerGroup,
          'transport public' : publicTransportLayerGroup,
          'Parkings' : ParkingLayerGroup,
          'Horeca' : HorecaLayerGroup,
          'Parking vélo' : BikeParkingLayerGroup
        }; 
        L.control.layers(null, overlay).addTo(mymapFR);

        //----------------------------------------------------------------------------------------
      }
      else
      {
        console.log("element bestaat niet");
      }
    }, 200);
    

  }
  else if(localStorage.getItem("GeselecteerdeTaal") == "ENG")
  {
    var mapLoad = "";
    //mymap.remove();
    mapLoad = "\map/{z}/{x}/{y}.png";
    var mapElementInterval = setInterval(function()
    {  
      var elementExists = document.getElementById("mapidENG");
      if(elementExists != null) 
      {
        try
        {
          mymap.remove();
        }
        catch(err)
        {
          console.log(err);
        }
        
        clearInterval(mapElementInterval);
        localStorage.setItem("MapENGInitialised","true");
        console.log("element bestaat");
        //----------------------------------------------------------------------------------------------
        //var mapboxUrl = "https://api.mapbox.com/styles/v1/groenestapstenenvzw/cjsa2ljft5tgs1ftdjcqr09mo/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiZ3JvZW5lc3RhcHN0ZW5lbnZ6dyIsImEiOiJjanMwNzNiN2MwMDhmNGFrdm9pZTlidzhzIn0.9eaZs-fbZSyygtfnyqUEIQ";
        mymapENG = L.map('mapidENG',
        {
          maxBounds: [
              //south west
              [50.680033, 4.313562],
              //north east
              [50.877788, 4.605838]
            ] 
          }).setView([50.791487, 4.448756], 13);
        L.tileLayer(mapLoad, {
        //L.tileLayer('https://api.mapbox.com/styles/v1/groenestapstenenvzw/cjsa2ljft5tgs1ftdjcqr09mo/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiZ3JvZW5lc3RhcHN0ZW5lbnZ6dyIsImEiOiJjanMwNzNiN2MwMDhmNGFrdm9pZTlidzhzIn0.9eaZs-fbZSyygtfnyqUEIQ', {
          maxZoom: 16,
          minZoom: 11,
          tileSize: 512,
          zoomOffset: -1,
        }).addTo(mymapENG);
        //mymap.on('load', () => console.log(map.getCanvas().toDataURL()));
        
        mymapENG.locate(
        {
          setView: false, 
          maxZoom: 16, 
          watch:true
        });
        var heritageLayerGroup = L.layerGroup();
        //console.log(coords);
        var DBOpenRequest = window.indexedDB.open("Heritage", 4);
        DBOpenRequest.onsuccess = function(event) 
        {
          db = DBOpenRequest.result;
          //console.log("db = " + db);
          var tx = db.transaction("Heritage_images","readonly");
          var opgehaaldeHeritage = tx.objectStore("Heritage_images");
          var request = opgehaaldeHeritage.getAll();
          request.onsuccess = function(evt) 
          {  
            // Extract all the objects from the event.target.result
          
            var cursor = evt.target.result;
            //console.log(cursor[1].value.imagename);
            for(var i = 0; i< cursor.length;i++)
            {
              var boomtestcontent =`
              <div class="card demo-card-header-pic">
                <div style="background-image:url(` + cursor[i].value.imagename +`)"
                  class="card-header align-items-flex-end">
                </div>
                <div class="card-content card-content-padding">
                  <p class="date">` + cursor[i].value.name.en +`</p>
                  <p>` +cursor[i].value.longtext.en +`</p>
                </div>
              </div>
              `;
              var marker = new L.marker([cursor[i].value.latitude, cursor[i].value.longitude], {icon: HeritageIcon}).bindPopup(boomtestcontent);
              heritageLayerGroup.addLayer(marker);
            }
            
            
            
            //console.log("Heritage info = " + JSON.stringify(cursor.value,null,2));
            //cursor.continue();
          }
        }
        var gatesLayerGroup = L.layerGroup();
        var gatesInfo = JSON.parse(localStorage.getItem("Gates"));
        for(var i = 0; i<gatesInfo.length; i++)
        {
          var heritageContent =`
              
                <p>` + gatesInfo[i].name.en +`</p>
                <p>` + gatesInfo[i].description.en +`</p>
              `;
          //console.log("Gate " + [i] + "= " + JSON.stringify(gatesInfo[i],null,2));
          var marker = new L.circle([gatesInfo[i].latitude, gatesInfo[i].longitude], 
            {
              color: "green",
              icon: HeritageIcon,
              fillOpacity : 0,
              radius: 500
          }).bindPopup(heritageContent);
          var gateMarker = new L.marker([gatesInfo[i].latitude, gatesInfo[i].longitude], {icon: GateIcon}).bindPopup(heritageContent);
          gatesLayerGroup.addLayer(marker);
        }
        var publicTransportLayerGroup = L.layerGroup();
        var publicTransportInfo = JSON.parse(localStorage.getItem("publicTransport"));
        for(var i = 0; i<publicTransportInfo.length; i++)
        {
          var publicTransportInfoContent =`
          <p>` + publicTransportInfo[i].description.en +`</p>
        `;
          var publicTransportInfoMarker = new L.marker([publicTransportInfo[i].latitude, publicTransportInfo[i].longitude], {icon: publicTransportIcon}).bindPopup(publicTransportInfoContent);
          publicTransportLayerGroup.addLayer(publicTransportInfoMarker);
        }

        var ParkingLayerGroup = L.layerGroup();
        var ParkingInfo = JSON.parse(localStorage.getItem("Parkings"));
        for(var i = 0; i<ParkingInfo.length; i++)
        {
          var ParkingInfoContent =`
          <p>` + ParkingInfo[i].description.en +`</p>
        `;
          var ParkingInfoMarker = new L.marker([ParkingInfo[i].latitude, ParkingInfo[i].longitude], {icon: parkingIcon}).bindPopup(ParkingInfoContent);
          ParkingLayerGroup.addLayer(ParkingInfoMarker);
        }
        
        var HorecaLayerGroup = L.layerGroup();
        var HorecaInfo = JSON.parse(localStorage.getItem("Horeca"));
        for(var i = 0; i<HorecaInfo.length; i++)
        {
          var HorecaInfoContent =`
          <p>` + HorecaInfo[i].name.en +`</p>
        `;
          var HorecaInfoMarker = new L.marker([HorecaInfo[i].latitude, HorecaInfo[i].longitude], {icon: horecaIcon}).bindPopup(HorecaInfoContent);
          HorecaLayerGroup.addLayer(HorecaInfoMarker);
        }

        var BikeParkingLayerGroup = L.layerGroup();
        var BikeParkingInfo = JSON.parse(localStorage.getItem("BikeParkings"));
        for(var i = 0; i<BikeParkingInfo.length; i++)
        {
          var BikeParkingInfoContent =`
          <p>` + BikeParkingInfo[i].name.en +`<br>
          ` + BikeParkingInfo[i].description.en +`</p>
        `;
          var BikeParkingInfoMarker = new L.marker([BikeParkingInfo[i].latitude, BikeParkingInfo[i].longitude], {icon: fietsParkingIcon}).bindPopup(BikeParkingInfoContent);
          BikeParkingLayerGroup.addLayer(BikeParkingInfoMarker);
        }
        var overlay = 
        {
          'Heritage': heritageLayerGroup,
          'Gates': gatesLayerGroup,
          'Public Transport' : publicTransportLayerGroup,
          'Parkings' : ParkingLayerGroup,
          'Horeca' : HorecaLayerGroup,
          'Bike parking' : BikeParkingLayerGroup
        }; 
        L.control.layers(null, overlay).addTo(mymapENG);
        //----------------------------------------------------------------------------------------
      }
      else
      {
        console.log("element bestaat niet");
      }
    }, 200);
    

  }
  
}
function MapInitialise()
{
  localStorage.setItem("MapNLInitialised", "false");
  localStorage.setItem("MapFRInitialised", "false");
  localStorage.setItem("MapENGInitialised", "false");
}
//HeritageLayer();
function HeritageLayer()
{
  var layerGroup = L.layerGroup();
  var longtext;
  var aantal = JSON.parse(localStorage.getItem("HeritageNames")).length;
  var names = JSON.parse(localStorage.getItem("HeritageNames"));
  //console.log("aantal = " + names[1]);
  for (var i = 0; i < aantal; i++)
  {
    //testLocalStorage[i] = localStorage.getItem(localStorage.key(i));
    /*try
    {
      localforage.getItem("Heritage" + names[i], function(err, value) 
      {
        
        longtext = value.longtext.nl;
        //console.log(value) 
        console.log("latitude = " + value.latitude);
        console.log("longitude = " + value.longitude);
        var name = value.name.nl.replace(/\s/g, "");
        console.log("Name = " + name);
          var heritagePopupContent =
          `
            <div class="card demo-card-header-pic">
            <a href="/Event/">
            <div style="background-image:url(` + value.imagename + `)"
              class="card-header align-items-flex-end"></div>
            </a>
            <div class="card-content card-content-padding">
              <p class="date">` + value.name.nl + `</p>
              <p> ` + value.longtext.nl + `</p>
            </div>
            <div class="card-footer"><a href="#" class="link">Meer Info</a></div>
            </div>
          `;
          //heritageLayer.push(L.marker([value.latitude, value.longitude]).bindPopup(heritagePopupContent));
          var HeritagePoint = L.marker([value.latitude, value.longitude]).bindPopup(heritagePopupContent);
          layerGroup.addLayer(HeritagePoint);
          var overlay = 
          {
            'Heritage': layerGroup,
          }; 
          L.control.layers(null, overlay).addTo(mymap);
        });
    }
    catch(err)
    {
      console.log("heritage error: " + err);
    }*/
  }
        var RuusbroeckLine =  L.polyline([50.7705,4.40102],{icon: HeritageIcon});
        layerGroup.addLayer(RuusbroeckLine);

        /*om naar deze specifieke lijn op de map te gaan*/
        //mymap.fitBounds(RuusbroeckLine.getBounds());
        var overlay = 
        {
          'Heritage': layerGroup,
        }; 
        L.control.layers(null, overlay).addTo(mymap);
  
}
function routeDivVullen(id)
{
  var savedRoutesContent = [];
  if(localStorage.getItem("GeselecteerdeTaal") == "NL")
  {
    var x = document.getElementsByClassName("soort-wandelNL");
    for (var i = 0; i < x.length; i++) 
    {
        x[i].style.backgroundColor="";
    }
    var elementId = id;
    if(elementId == "0 wandel")
    {
      document.getElementsByClassName("soort-wandelNL")[0].style.backgroundColor = "#ffe43c";
    }
    else if(elementId == "1 fiets")
    {
      document.getElementsByClassName("soort-wandelNL")[1].style.backgroundColor = "#088c34";
    }
    else if(elementId == "2 paard")
    {
      document.getElementsByClassName("soort-wandelNL")[2].style.backgroundColor = "red";
    }
    else if(elementId == "3 rolstoel")
    {
        document.getElementsByClassName("soort-wandelNL")[3].style.backgroundColor = "yellow";
    }
    
    savedRoutesContent = RouteContent();
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
        var tabRoute = document.getElementById("tab-routeNL");
        tabRoute.innerHTML = "";

        var aantalRoutes = 0;
        for(var i = 0; i < savedRoutesContent.length;i++)
        {
          var savedRoutesContentUniqueName = savedRoutesContent[i].uniqueName;
          savedRoutesContentUniqueName = savedRoutesContentUniqueName.replace(/\s/g, "");
          var content = document.createElement("div");
          var duurRoute = BerekenTijd(savedRoutesContent[i].distance, typeRoute);//-> hier een functie voor maken 
          //console.log(duurRoute);
          var savedRoutesContentUniqueName = savedRoutesContent[i].uniqueName;
          savedRoutesContentUniqueName = savedRoutesContentUniqueName.replace(/\s/g, "");
          var content = document.createElement("div");
          var duurRoute = BerekenTijd(savedRoutesContent[i].distance, typeRoute);//-> hier een functie voor maken 
          //console.log(duurRoute);
            content.innerHTML = `
            <div style=" height: 8%; width="width:100%" id=`+savedRoutesContentUniqueName+` onclick="GekozenRoute(this.id)" class ="routeChoice popup-close">
            <div class="vl">
            <div class="routechoicetext">
                <p>` + savedRoutesContent[i].name.nl + `<br>
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
                    <label id= " ` + savedRoutesContentUniqueName +`Duur">
                      ` + duurRoute + `min
                    </label>
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
                  vlElement[vlElement.length-1].style.borderLeft = "6px solid #ffe43c";
              }
              else if(elementId == "1 fiets")
              {
                  vlElement[vlElement.length-1].style.borderLeft = "6px solid green";
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
  else if(localStorage.getItem("GeselecteerdeTaal") == "FR")
  {
    var x = document.getElementsByClassName("soort-wandelFR");
    for (var i = 0; i < x.length; i++) 
    {
        x[i].style.backgroundColor="";
    }
    var elementId = id;
    if(elementId == "0 wandel")
    {
      document.getElementsByClassName("soort-wandelFR")[0].style.backgroundColor = "#ffe43c";
    }
    else if(elementId == "1 fiets")
    {
      document.getElementsByClassName("soort-wandelFR")[1].style.backgroundColor = "#088c34";
    }
    else if(elementId == "2 paard")
    {
      document.getElementsByClassName("soort-wandelFR")[2].style.backgroundColor = "red";
    }
    else if(elementId == "3 rolstoel")
    {
        document.getElementsByClassName("soort-wandelFR")[3].style.backgroundColor = "yellow";
    }
    
    savedRoutesContent = RouteContent();
    var dropDownElementInterval = setInterval(function()
    {
      var e = document.getElementById("poortendropdownFR");
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
        var tabRoute = document.getElementById("tab-routeFR");
        tabRoute.innerHTML = "";

        var aantalRoutes = 0;
        for(var i = 0; i < savedRoutesContent.length;i++)
        {
          var savedRoutesContentUniqueName = savedRoutesContent[i].uniqueName;
          savedRoutesContentUniqueName = savedRoutesContentUniqueName.replace(/\s/g, "");
          var content = document.createElement("div");
          var duurRoute = BerekenTijd(savedRoutesContent[i].distance, typeRoute);//-> hier een functie voor maken 
          //console.log(duurRoute);
          var savedRoutesContentUniqueName = savedRoutesContent[i].uniqueName;
          savedRoutesContentUniqueName = savedRoutesContentUniqueName.replace(/\s/g, "");
          var content = document.createElement("div");
          var duurRoute = BerekenTijd(savedRoutesContent[i].distance, typeRoute);//-> hier een functie voor maken 
          //console.log(duurRoute);
            content.innerHTML = `
            <div style=" height: 8%; width="width:100%" id=`+savedRoutesContentUniqueName+` onclick="GekozenRoute(this.id)" class ="routeChoice popup-close">
            <div class="vl">
            <div class="routechoicetext">
                <p>` + savedRoutesContent[i].name.fr + `<br>
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
                    <label id= " ` + savedRoutesContentUniqueName +`Duur">
                      ` + duurRoute + `min
                    </label>
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
                  vlElement[vlElement.length-1].style.borderLeft = "6px solid #ffe43c";
              }
              else if(elementId == "1 fiets")
              {
                  vlElement[vlElement.length-1].style.borderLeft = "6px solid green";
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
  else if(localStorage.getItem("GeselecteerdeTaal") == "ENG")
  {
    var x = document.getElementsByClassName("soort-wandelENG");
    for (var i = 0; i < x.length; i++) 
    {
        x[i].style.backgroundColor="";
    }
    var elementId = id;
    if(elementId == "0 wandel")
    {
      document.getElementsByClassName("soort-wandelENG")[0].style.backgroundColor = "#ffe43c";
    }
    else if(elementId == "1 fiets")
    {
      document.getElementsByClassName("soort-wandelENG")[1].style.backgroundColor = "#088c34";
    }
    else if(elementId == "2 paard")
    {
      document.getElementsByClassName("soort-wandelENG")[2].style.backgroundColor = "red";
    }
    else if(elementId == "3 rolstoel")
    {
        document.getElementsByClassName("soort-wandelENG")[3].style.backgroundColor = "yellow";
    }
    
    savedRoutesContent = RouteContent();
    var dropDownElementInterval = setInterval(function()
    {
      var e = document.getElementById("poortendropdownENG");
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
        var tabRoute = document.getElementById("tab-routeENG");
        tabRoute.innerHTML = "";

        var aantalRoutes = 0;
        for(var i = 0; i < savedRoutesContent.length;i++)
        {
          var savedRoutesContentUniqueName = savedRoutesContent[i].uniqueName;
          savedRoutesContentUniqueName = savedRoutesContentUniqueName.replace(/\s/g, "");
          var content = document.createElement("div");
          var duurRoute = BerekenTijd(savedRoutesContent[i].distance, typeRoute);//-> hier een functie voor maken 
          //console.log(duurRoute);
          var savedRoutesContentUniqueName = savedRoutesContent[i].uniqueName;
          savedRoutesContentUniqueName = savedRoutesContentUniqueName.replace(/\s/g, "");
          var content = document.createElement("div");
          var duurRoute = BerekenTijd(savedRoutesContent[i].distance, typeRoute);//-> hier een functie voor maken 
          //console.log(duurRoute);
            content.innerHTML = `
            <div style=" height: 8%; width="width:100%" id=`+savedRoutesContentUniqueName+` onclick="GekozenRoute(this.id)" class ="routeChoice popup-close">
            <div class="vl">
            <div class="routechoicetext">
                <p>` + savedRoutesContent[i].name.en + `<br>
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
                    <label id= " ` + savedRoutesContentUniqueName +`Duur">
                      ` + duurRoute + `min
                    </label>
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
                  vlElement[vlElement.length-1].style.borderLeft = "6px solid #ffe43c";
              }
              else if(elementId == "1 fiets")
              {
                  vlElement[vlElement.length-1].style.borderLeft = "6px solid green";
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
  var gates = [];
  
  gates = JSON.parse(localStorage.getItem("Gates"));
  var gateID;
  var typeRoute = localStorage.getItem("GeselecteerdeRouteSoort");
  for(var i = 0; i< gates.length;i++)
  {
    if(localStorage.getItem("GeselecteerdeTaal") == "NL")
    {
      var x = gates[i].name.nl;
    }
    else if(localStorage.getItem("GeselecteerdeTaal") == "FR")
    {
      var x = gates[i].name.fr;
    }
    else if(localStorage.getItem("GeselecteerdeTaal") == "ENG")
    {
      var x = gates[i].name.en;
    }
    if(gateNaam == x)
    {
      gateID = gates[i].type;
    }
  }
  if(localStorage.getItem("GeselecteerdeTaal") == "NL")
  {
    var tabRoute = document.getElementById("tab-routeNL");
  
    tabRoute.innerHTML = "";
    //console.log("route type: " + typeRoute);
    //console.log("GateID: " + gateID);
    var aantalRoutes = 0;
    for(var i = 0; i < savedRoutesContent.length;i++)
    {
      var savedRoutesContentUniqueName = savedRoutesContent[i].uniqueName;
      savedRoutesContentUniqueName = savedRoutesContentUniqueName.replace(/\s/g, "");
      //console.log("uniquename = " + savedRoutesContent[i].uniqueName);
      var content = document.createElement("div");
      var duurRoute = BerekenTijd(savedRoutesContent[i].distance, typeRoute);
        content.innerHTML = `
        <div style=" height: 8%; width:100%" id=` + savedRoutesContentUniqueName +` onclick="GekozenRoute(this.id)" class ="routeChoice popup-close">
        <div class="vl">
        <div class="routechoicetext">
            <p>` + savedRoutesContent[i].name.nl + `<br>
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
                <label id= " ` + savedRoutesContentUniqueName +`Duur">
                  ` + duurRoute + `min
                </label>
              
            </label>
            <hr>
          </div>
        </div>
        </div>
        `;
      if(savedRoutesContent[i].gateType == gateID)
      {
        console.log("gatetype == gateID");
        if(savedRoutesContent[i].type == typeRoute)
        {
          //console.log("type == typeroute");
          tabRoute.appendChild(content);
          var vlElement = document.getElementsByClassName("vl");
          if(typeRoute == 0)
          {
              vlElement[vlElement.length-1].style.borderLeft = " 6px solid #ffe43c";
          }
          else if(typeRoute == 1)
          {
              vlElement[vlElement.length-1].style.borderLeft = " 6px solid #088c34";
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
  else if(localStorage.getItem("GeselecteerdeTaal") == "FR")
  {
    var tabRoute = document.getElementById("tab-routeFR");
  
    tabRoute.innerHTML = "";
    //console.log("route type: " + typeRoute);
    //console.log("GateID: " + gateID);
    var aantalRoutes = 0;
    console.log("content.length : " + savedRoutesContent.length);
    for(var i = 0; i < savedRoutesContent.length;i++)
    {
      var savedRoutesContentUniqueName = savedRoutesContent[i].uniqueName;
      savedRoutesContentUniqueName = savedRoutesContentUniqueName.replace(/\s/g, "");
      //console.log("uniquename = " + savedRoutesContent[i].uniqueName);
      var content = document.createElement("div");
      var duurRoute = BerekenTijd(savedRoutesContent[i].distance, typeRoute);//-> hier een functie voor maken 
        content.innerHTML = `
        <div style=" height: 8%; width:100%" id=` + savedRoutesContentUniqueName +` onclick="GekozenRoute(this.id)" class ="routeChoice popup-close">
        <div class="vl">
        <div class="routechoicetext">
            <p>` + savedRoutesContent[i].name.fr + `<br>
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
                <label id= " ` + savedRoutesContentUniqueName +`Duur">
                  ` + duurRoute + `min
                </label>
              
            </label>
            <hr>
          </div>
        </div>
        </div>
        `;
      if(savedRoutesContent[i].gateType == gateID)
      {
        console.log("gatetype == gateID");
        if(savedRoutesContent[i].type == typeRoute)
        {
          console.log("type == typeroute");
          tabRoute.appendChild(content);
          var vlElement = document.getElementsByClassName("vl");
          if(typeRoute == 0)
          {
              vlElement[vlElement.length-1].style.borderLeft = " 6px solid #ffe43c";
          }
          else if(typeRoute == 1)
          {
              vlElement[vlElement.length-1].style.borderLeft = " 6px solid #088c34";
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
  else if(localStorage.getItem("GeselecteerdeTaal") == "ENG")
  {
    var tabRoute = document.getElementById("tab-routeENG");
    tabRoute.innerHTML = "";
    //console.log("route type: " + typeRoute);
    //console.log("GateID: " + gateID);
    var aantalRoutes = 0;
    for(var i = 0; i < savedRoutesContent.length;i++)
    {
      var savedRoutesContentUniqueName = savedRoutesContent[i].uniqueName;
      savedRoutesContentUniqueName = savedRoutesContentUniqueName.replace(/\s/g, "");
      //console.log("uniquename = " + savedRoutesContent[i].uniqueName);
      var content = document.createElement("div");
      var duurRoute = BerekenTijd(savedRoutesContent[i].distance, typeRoute);//-> hier een functie voor maken 
        content.innerHTML = `
        <div style=" height: 8%; width:100%" id=` + savedRoutesContentUniqueName +` onclick="GekozenRoute(this.id)" class ="routeChoice popup-close">
        <div class="vl">
        <div class="routechoicetext">
            <p>` + savedRoutesContent[i].name.en + `<br>
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
                <label id= " ` + savedRoutesContentUniqueName +`Duur">
                  ` + duurRoute + `min
                </label>
              
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
              vlElement[vlElement.length-1].style.borderLeft = " 6px solid #ffe43c";
          }
          else if(typeRoute == 1)
          {
              vlElement[vlElement.length-1].style.borderLeft = " 6px solid #088c34";
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
}
function GekozenRoute(name)
{
  if(localStorage.getItem("GeselecteerdeTaal") == "NL")
  {
    console.log("route geselecteerd");
    var gekozenRouteName = name;
    var localstorageRoutePoints = gekozenRouteName + "RoutePoints";
    coords = JSON.parse(localStorage.getItem(localstorageRoutePoints));
    console.log(localstorageRoutePoints);

    StartMarker = L.marker([coords[0].lat,coords[0].lng], {icon: StartIcon});
    mymapNL.addLayer(StartMarker);
    document.getElementById("mapidNL").style.height = "85%";
    document.getElementsByClassName("btnRouteNL")[0].style.display = "none";
    document.getElementsByClassName("KiesRouteDivNL")[0].style.display = 'none';
    document.getElementsByClassName("BeforeRouteNL")[0].style.display = 'block';
    if (Framework7.device.ios) 
    {
      document.getElementsByClassName("BeforeRouteNL")[0].style.marginTop = "-29%";
    }
    else
    {
      document.getElementsByClassName("BeforeRouteNL")[0].style.marginTop = "-22%";
    }

    var x;
    for (var i = 0; i < localStorage.length; i++)
    {
      //testLocalStorage[i] = localStorage.getItem(localStorage.key(i));
      try
      {
        //kijken of het eerste teken van x een { of een [ is, indien nee, continue anders break
        x = localStorage.getItem(localStorage.key(i));
        x = JSON.parse(x);
        //x = JSON.stringify(x,null,2);
        if(gekozenRouteName == x.uniqueName.replace(/\s/g, ""))
        {
          document.getElementsByClassName("BeforeRouteNameNL")[0].innerHTML = x.name.nl;
          localStorage.setItem("GekozenRouteName",x.name.nl);
          GekozenRouteDistance = x.distance;
          GekozenRouteType = x.type;
          console.log("GekozenRouteType = " + GekozenRouteType);
          console.log("GekozenRouteDistance = " + GekozenRouteDistance);
          TotaleDuurRoute = BerekenTijd(GekozenRouteDistance, GekozenRouteType);

          var duurPerPolylineInterval = setInterval(function()
          {
            if(polylineLines != undefined)
            {
              if(polylineLines != "")
              {
                DuurPerPolyline = TotaleDuurRoute /polylineLines.length;
                clearInterval(duurPerPolylineInterval);
              }
            }
          },200)
        }
      }
      catch(err)
      {
        console.log("error: " + err);
      }
    }
    if(localStorage.getItem("polyline") !=null)
    {
      for (var key in window) 
      {
        try
        {
          if(window["polyline" + (x)] != undefined)
          {
            if(window["polyline" + (x)].options.color == "yellow" || window["polyline" + (x)].options.color == "orange" || window["polyline" + (x)].options.color == "lightgreen")
            {
              mymapNL.removeLayer(window["polyline" + (x)]);
            }
          }
          else
          {
            console.log("polyline is undefined");
          }
        }
        catch(err)
        {
          console.log(err);
        }
        x++;
      }
    }
    for(var i = 0; i < coords.length; i++)
    {
      if(i>0)
      {
        polylineLines.push([[coords[i-1].lat, coords[i-1].lng],[coords[i].lat, coords[i].lng]]);
        if(i<3)
        {
          window['polyline' + i] = [[coords[i-1].lat, coords[i-1].lng],[coords[i].lat, coords[i].lng]];
          window['polyline' + i] = L.polyline( window['polyline' + i]).addTo(mymapNL); 
          window['polyline' + i].setStyle(
          {
            color: 'yellow'
          }); 
        }
        else
        {
          window['polyline' + i] = [[coords[i-1].lat, coords[i-1].lng],[coords[i].lat, coords[i].lng]];
          //console.log(window['polyline' + i]);
          
          //polylineLines.push(window['polyline' + i]);
          window['polyline' + i] = L.polyline( window['polyline' + i]).addTo(mymapNL); 
          window['polyline' + i].setStyle(
          {
            color: 'orange'
          }); 
        }
        
      }
      //console.log(coords[i]);
    }
    document.getElementsByClassName("RouteTotaleAfstandNL")[0].innerHTML = GekozenRouteDistance;
    document.getElementsByClassName("RouteAfgelegdeAfstandNL")[0].innerHTML = "0.00";
    document.getElementsByClassName("RouteResterendeTijdNL")[0].innerHTML = TotaleDuurRoute;
  }
  else if(localStorage.getItem("GeselecteerdeTaal") == "FR")
  {
    console.log("route geselecteerd");
    var gekozenRouteName = name;
    var localstorageRoutePoints = gekozenRouteName + "RoutePoints";
    coords = JSON.parse(localStorage.getItem(localstorageRoutePoints));
    console.log(localstorageRoutePoints);

    StartMarker = L.marker([coords[0].lat,coords[0].lng], {icon: StartIcon});
    mymapFR.addLayer(StartMarker);
    document.getElementById("mapidFR").style.height = "85%";
    document.getElementsByClassName("btnRouteFR")[0].style.display = "none";
    document.getElementsByClassName("KiesRouteDivFR")[0].style.display = 'none';
    document.getElementsByClassName("BeforeRouteFR")[0].style.display = 'block';
    if (Framework7.device.ios) 
    {
      document.getElementsByClassName("BeforeRouteFR")[0].style.marginTop = "-29%";
    }
    else
    {
      document.getElementsByClassName("BeforeRouteFR")[0].style.marginTop = "-22%";
    }
    var x;
    for (var i = 0; i < localStorage.length; i++)
    {
      //testLocalStorage[i] = localStorage.getItem(localStorage.key(i));
      try
      {
        //kijken of het eerste teken van x een { of een [ is, indien nee, continue anders break
        x = localStorage.getItem(localStorage.key(i));
        x = JSON.parse(x);
        //x = JSON.stringify(x,null,2);
        if(gekozenRouteName == x.uniqueName.replace(/\s/g, ""))
        {
          document.getElementsByClassName("BeforeRouteNameFR")[0].innerHTML = x.name.fr;
          localStorage.setItem("GekozenRouteName",x.name.fr);
          GekozenRouteDistance = x.distance;
          GekozenRouteType = x.type;
          console.log("GekozenRouteType = " + GekozenRouteType);
          console.log("GekozenRouteDistance = " + GekozenRouteDistance);
          TotaleDuurRoute = BerekenTijd(GekozenRouteDistance, GekozenRouteType);

          var duurPerPolylineInterval = setInterval(function()
          {
            if(polylineLines != undefined)
            {
              if(polylineLines != "")
              {
                DuurPerPolyline = TotaleDuurRoute /polylineLines.length;
                clearInterval(duurPerPolylineInterval);
              }
            }
          },200)
        }
      }
      catch(err)
      {
        console.log("error: " + err);
      }
    }
    if(localStorage.getItem("polyline") !=null)
    {
      for (var key in window) 
      {
        try
        {
          if(window["polyline" + (x)] != undefined)
          {
            if(window["polyline" + (x)].options.color == "yellow" || window["polyline" + (x)].options.color == "orange" || window["polyline" + (x)].options.color == "lightgreen")
            {
              mymapFR.removeLayer(window["polyline" + (x)]);
            }
          }
          else
          {
            console.log("polyline is undefined");
          }
        }
        catch(err)
        {
          console.log(err);
        }
        x++;
      }
    }
    for(var i = 0; i < coords.length; i++)
    {
      if(i>0)
      {
        if(i<3)
        {
          window['polyline' + i] = [[coords[i-1].lat, coords[i-1].lng],[coords[i].lat, coords[i].lng]];
          window['polyline' + i] = L.polyline( window['polyline' + i]).addTo(mymapFR); 
          window['polyline' + i].setStyle(
          {
            color: 'yellow'
          }); 
        }
        else
        {
          window['polyline' + i] = [[coords[i-1].lat, coords[i-1].lng],[coords[i].lat, coords[i].lng]];
          //console.log(window['polyline' + i]);
          polylineLines.push([[coords[i-1].lat, coords[i-1].lng],[coords[i].lat, coords[i].lng]]);
          //polylineLines.push(window['polyline' + i]);
          window['polyline' + i] = L.polyline( window['polyline' + i]).addTo(mymapFR); 
          window['polyline' + i].setStyle(
          {
            color: 'orange'
          }); 
        }
        
      }
      //console.log(coords[i]);
    }
    document.getElementsByClassName("RouteTotaleAfstandFR")[0].innerHTML = GekozenRouteDistance;
    document.getElementsByClassName("RouteAfgelegdeAfstandFR")[0].innerHTML = "0.00";
    document.getElementsByClassName("RouteResterendeTijdFR")[0].innerHTML = TotaleDuurRoute;
  }
  else if(localStorage.getItem("GeselecteerdeTaal") == "ENG")
  {
    console.log("route geselecteerd");
    var gekozenRouteName = name;
    var localstorageRoutePoints = gekozenRouteName + "RoutePoints";
    coords = JSON.parse(localStorage.getItem(localstorageRoutePoints));
    console.log(localstorageRoutePoints);

    StartMarker = L.marker([coords[0].lat,coords[0].lng], {icon: StartIcon});
    mymapENG.addLayer(StartMarker);
    document.getElementById("mapidENG").style.height = "85%";
    document.getElementsByClassName("btnRouteENG")[0].style.display = "none";
    document.getElementsByClassName("KiesRouteDivENG")[0].style.display = 'none';
    document.getElementsByClassName("BeforeRouteENG")[0].style.display = 'block';
    if (Framework7.device.ios) 
    {
      document.getElementsByClassName("BeforeRouteENG")[0].style.marginTop = "-29%";
    }
    else
    {
      document.getElementsByClassName("BeforeRouteENG")[0].style.marginTop = "-22%";
    }
    var x;
    for (var i = 0; i < localStorage.length; i++)
    {
      //testLocalStorage[i] = localStorage.getItem(localStorage.key(i));
      try
      {
        //kijken of het eerste teken van x een { of een [ is, indien nee, continue anders break
        x = localStorage.getItem(localStorage.key(i));
        x = JSON.parse(x);
        //x = JSON.stringify(x,null,2);
        if(gekozenRouteName == x.uniqueName.replace(/\s/g, ""))
        {
          document.getElementsByClassName("BeforeRouteNameENG")[0].innerHTML = x.name.en;
          localStorage.setItem("GekozenRouteName",x.name.en);
          GekozenRouteDistance = x.distance;
          GekozenRouteType = x.type;
          console.log("GekozenRouteType = " + GekozenRouteType);
          console.log("GekozenRouteDistance = " + GekozenRouteDistance);
          TotaleDuurRoute = BerekenTijd(GekozenRouteDistance, GekozenRouteType);

          var duurPerPolylineInterval = setInterval(function()
          {
            if(polylineLines != undefined)
            {
              if(polylineLines != "")
              {
                DuurPerPolyline = TotaleDuurRoute /polylineLines.length;
                clearInterval(duurPerPolylineInterval);
              }
            }
          },200)
        }
      }
      catch(err)
      {
        console.log("error: " + err);
      }
    }
    if(localStorage.getItem("polyline") !=null)
    {
      for (var key in window) 
      {
        try
        {
          if(window["polyline" + (x)] != undefined)
          {
            if(window["polyline" + (x)].options.color == "yellow" || window["polyline" + (x)].options.color == "orange" || window["polyline" + (x)].options.color == "lightgreen")
            {
              mymapENG.removeLayer(window["polyline" + (x)]);
            }
          }
          else
          {
            console.log("polyline is undefined");
          }
        }
        catch(err)
        {
          console.log(err);
        }
        x++;
      }
    }
    for(var i = 0; i < coords.length; i++)
    {
      if(i>0)
      {
        if(i<3)
        {
          window['polyline' + i] = [[coords[i-1].lat, coords[i-1].lng],[coords[i].lat, coords[i].lng]];
          window['polyline' + i] = L.polyline( window['polyline' + i]).addTo(mymapENG); 
          window['polyline' + i].setStyle(
          {
            color: 'yellow'
          }); 
        }
        else
        {
          window['polyline' + i] = [[coords[i-1].lat, coords[i-1].lng],[coords[i].lat, coords[i].lng]];
          //console.log(window['polyline' + i]);
          polylineLines.push([[coords[i-1].lat, coords[i-1].lng],[coords[i].lat, coords[i].lng]]);
          //polylineLines.push(window['polyline' + i]);
          window['polyline' + i] = L.polyline( window['polyline' + i]).addTo(mymapENG); 
          window['polyline' + i].setStyle(
          {
            color: 'orange'
          }); 
        }
        
      }
      //console.log(coords[i]);
    }
    document.getElementsByClassName("RouteTotaleAfstandENG")[0].innerHTML = GekozenRouteDistance;
    document.getElementsByClassName("RouteAfgelegdeAfstandENG")[0].innerHTML = "0.00";
    document.getElementsByClassName("RouteResterendeTijdENG")[0].innerHTML = TotaleDuurRoute;
  }
  /*
  var x = JSON.parse(localStorage.getItem(localStorage.key(4)));
  x = JSON.stringify(x,null,2);
  console.log("GekozenName = " + x);
*/  
  
  /*window['polyline' + (0)] = [[polylineLines[0][0][0], polylineLines[0][0][1]],[polylineLines[0][1][0], polylineLines[0][1][1]]];
  window['polyline' + (0)] = L.polyline( window['polyline' + (0)],{color: 'yellow'}).addTo(mymap);
  window['polyline' + (1)] = [[polylineLines[0][0][0], polylineLines[0][0][1]],[polylineLines[0][1][0], polylineLines[0][1][1]]];
  window['polyline' + (1)] = L.polyline( window['polyline' + (1)],{color: 'yellow'}).addTo(mymap);*/
  localStorage.setItem("polyline",JSON.stringify(coords));
  polylineCoords = coords;

  //console.log(polylineCoords);
  //Kaart(coords);
}
$(document).on('page:init', function (e, page) 
{
  var gates = [];
  localStorage.setItem("GeselecteerdeRouteSoort",0);
  if(localStorage.getItem("GeselecteerdeTaal") == "FR")
  {

    console.log("frans geselecteerd");
    //MapInitialise();
    var iconTooltipFRCarte = app.tooltip.create(
    {
      targetEl: '.tooltip-FRCarte',
      text: "Partagez votre localisation afin que nous puissions facilement localiser le problème.",
    });
    var iconTooltipFREncy = app.tooltip.create(
    {
      targetEl: '.tooltip-FREncy',
      text: "Partagez votre localisation afin que nous puissions facilement localiser le problème.",
    });
    

    gates = JSON.parse(localStorage.getItem("Gates"));
    //console.log("interval stopt");
  
    var select = document.getElementById("poortendropdownFR"); 
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
        el.value = opt.name.fr;
        select.appendChild(el);
      }
      var savedRoutesContent = [];

      savedRoutesContent = RouteContent();
      //savedRoutesContent = JSON.parse(localStorage.getItem())
      var dropDownElementInterval = setInterval(function()
      {
        var e = document.getElementById("poortendropdownFR");
        if(e != null)
        {
          
          clearInterval(dropDownElementInterval);
          document.getElementsByClassName("soort-wandelFR")[0].style.backgroundColor = "#ffe43c";
          //stijlElement.getElementById("0 wandel").style.backgroundColor = "#ffe43c";
          var geselecteerdeGate= 0;
          var gateNaam = e.options[e.selectedIndex].value;
          var typeRoute = 0;
          //console.log(gateId);
          var tabRoute = document.getElementById("tab-routeFR");
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
              <div style=" height: 8%; width:100%" id=`+savedRoutesContentUniqueName+` onclick="GekozenRoute(this.id)" class ="routeChoice popup-close">
                <div class="vl">
                  <div class="routechoicetext " >
                      <p>` + savedRoutesContent[i].name.fr + `<br>
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
                          <label id= " ` + savedRoutesContentUniqueName +`Duur">
                            ` + duurRoute + `min
                          </label>
                      </label>
                      <hr>
                    </div>
                  </div>
                </div>
              `;
              tabRoute.appendChild(content);
              //console.log("bovenstaande data is toegevoegd");
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

  }
  else if(localStorage.getItem("GeselecteerdeTaal") == "ENG")
  {
    console.log("eng loaded");
    var iconTooltipMap = app.tooltip.create({
      targetEl: '.tooltip-ENGMap',
      text: "Share your location so we can easily locate the spot of a possible problem.",
    });
    var iconTooltipEncyENG = app.tooltip.create({
      targetEl: '.tooltip-ENGEncy',
      text: "Share your location so we can easily locate the spot of a possible problem.",
    });
    gates = JSON.parse(localStorage.getItem("Gates"));
    //console.log("interval stopt");
  
    var select = document.getElementById("poortendropdownENG"); 
    if(select != null)
    {
      //console.log("select element bestaat");
      for(var i = 0; i < gates.length; i++) 
      {
        var opt = gates[i];
        //console.log(opt.name.nl);
        var el = document.createElement("option");
        el.textContent = opt.name.en;
        el.setAttribute("id", gates[i].type);
        el.setAttribute("value", gates[i].type);
        el.value = opt.name.en;
        select.appendChild(el);
      }
      var savedRoutesContent = [];

      savedRoutesContent = RouteContent();
      //savedRoutesContent = JSON.parse(localStorage.getItem())
      var dropDownElementInterval = setInterval(function()
      {
        var e = document.getElementById("poortendropdownENG");
        if(e != null)
        {
          
          clearInterval(dropDownElementInterval);
          document.getElementsByClassName("soort-wandelENG")[0].style.backgroundColor = "#ffe43c";
          var geselecteerdeGate= 0;
          var gateNaam = e.options[e.selectedIndex].value;
          var typeRoute = 0;
          //console.log(gateId);
          var tabRoute = document.getElementById("tab-routeENG");
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
              <div style=" height: 8%; width:100%" id=`+savedRoutesContentUniqueName+` onclick="GekozenRoute(this.id)" class ="routeChoice popup-close">
                <div class="vl">
                  <div class="routechoicetext " >
                      <p>` + savedRoutesContent[i].name.en + `<br>
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
                          <label id= " ` + savedRoutesContentUniqueName +`Duur">
                            ` + duurRoute + `min
                          </label>
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

  }
  else if(localStorage.getItem("GeselecteerdeTaal") == "NL")
  {
    console.log("in nl versie");
    var iconTooltipKaart = app.tooltip.create({
      targetEl: '.tooltip-NLKaart',
      text: "Deel jouw locatie zodat wij gemakkelijk de plaats kunnen signaleren waar een probleem zich voordoet.",
    });
    var iconTooltipEncie = app.tooltip.create({
      targetEl: '.tooltip-NLEncie',
      text: "Deel jouw locatie zodat wij gemakkelijk de plaats kunnen signaleren waar een probleem zich voordoet.",
    });
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
          document.getElementsByClassName("soort-wandelNL")[0].style.backgroundColor = "#ffe43c";
          var geselecteerdeGate= 0;
          var gateNaam = e.options[e.selectedIndex].value;
          var typeRoute = 0;
          //console.log(gateId);
          var tabRoute = document.getElementById("tab-routeNL");
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
              <div style=" height: 8%; width:100%" id=`+savedRoutesContentUniqueName+` onclick="GekozenRoute(this.id)" class ="routeChoice popup-close">
                <div class="vl">
                  <div class="routechoicetext " >
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
                          <label id= " ` + savedRoutesContentUniqueName +`Duur">
                            ` + duurRoute + `min
                          </label>
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
  //console.log("in scriptandupdate functie");
  if(localStorage.getItem("firebaseScriptsLoaded") == "true")
  {
    var internetStatus;
    //console.log("begininterval");
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
       //alert("eerste keer geladen true && appversion != null: " + err);
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


function onLocationFound(e) 
{
  var latlng;
  ///////////!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!AFGELEGDE AFSTAND UPDATE DE GELE LIJN IPV DE GROENE LIJN!!!!!!!!!!!!!!!
  // if position defined, then remove the existing position marker and accuracy circle from the map
  //console.log("location found");
  if(localStorage.getItem("GeselecteerdeTaal") == "NL")
  {
    console.log("locatie gevonden");
    if(localStorage.getItem("MapNLInitialised") == "true")
    {
      if (current_position) 
      {
        mymapNL.removeLayer(current_position);
      }
      latlng = 
      {
        lat: e.coords.latitude,
        lng: e.coords.longitude
      };
      lat = e.coords.latitude;
      long = e.coords.longitude;
      current_position = L.marker(latlng).addTo(mymapNL);
    }
    if(localStorage.getItem("RouteStart") == "true")
    {
      //---------------------------------------------------------------------------------------
      if(polylineLines != undefined)
      {
        if(polylineLines != "")
        {
          //console.log(window["polyline" + (coordinateLocationInArray)]);
          punt1Lat = e.coords.latitude;
          punt1Lng = e.coords.longitude
          punt2Lat = polylineCoords[coordinateLocationInArray].lat;
          punt2Lng = polylineCoords[coordinateLocationInArray].lng;

          var afstadTussenPunten = BerekenAfstandTussenPunt(punt1Lat, punt1Lng, punt2Lat, punt2Lng);
          
          if(afstadTussenPunten <20)
          {
            console.log("je bent binnen 20 meter van het punt");
            if(coordinateLocationInArray == polylineLines.length)
            {
              totaldistance = 0;
              console.log("route finished");
              localStorage.removeItem("polyline");
              polylineLines = [];
              polylineCoords = [];
              coordinateLocationInArray = 0;
              document.getElementById("mapidNL").style.height = "90%";
              document.getElementsByClassName("btnRouteNL")[0].style.display = "block";
              document.getElementsByClassName("BeforeRouteNL")[0].style.display = 'none';
              document.getElementsByClassName("KiesRouteDivNL")[0].style.display = 'block';
              document.getElementsByClassName("RouteInfoNL")[0].style.display = "none";
              for(var key in window)
              {
                if(key.includes("polyline"))
                {
                  if(hasNumber.test(key) == true)
                  {
                    if(window[key].options.color == "yellow" || window[key].options.color == "orange" || window[key].options.color == "lightgreen")
                    {
                      mymapNL.removeLayer(window[key]);
                    }
                  }
                }
              }
            }
            //-----------------------------------------------------------------------------------------------
            // ------------------------DISTANCE BEREKENEN----------------------------
            var punt1;
            var punt2;
            //console.log(coordinatesToCalculate[i].lat);
            punt1 = [polylineLines[coordinateLocationInArray][0][0], polylineLines[coordinateLocationInArray][0][1]];
            punt2 = [polylineLines[coordinateLocationInArray][1][0], polylineLines[coordinateLocationInArray][1][1]];
            
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
            totaldistance = totaldistance + d;
            console.log("d = " + totaldistance);
            //-----------------------------------------------------------------------
            
            //console.log("coordinateLocationInArray: " +coordinateLocationInArray );
            //  mymap.removeLayer(window["polyline" + (coordinateLocationInArray+1)]);
            if((coordinateLocationInArray + 1) !=  polylineLines.length || (coordinateLocationInArray + 1) >  polylineLines.length)
            {
              mymapNL.removeLayer(window["polyline" + (coordinateLocationInArray+1)]);
              window['polyline' + (coordinateLocationInArray+1)] = [[polylineLines[coordinateLocationInArray+1][0][0], polylineLines[coordinateLocationInArray+1][0][1]],[polylineLines[coordinateLocationInArray+1][1][0], polylineLines[coordinateLocationInArray+1][1][1]]];
              window['polyline' + (coordinateLocationInArray+1)] = L.polyline( window['polyline' + (coordinateLocationInArray+1)],{color: 'yellow'}).addTo(mymapNL);
            }
            if(coordinateLocationInArray+1 !=  (polylineLines.length + 1))
            {
              if(coordinateLocationInArray>0)
              {
                if(coordinateLocationInArray == 1)
                {
                  //mymapNL.removeLayer(window["polyline" + (coordinateLocationInArray-1)]);
                  window['polyline' + (coordinateLocationInArray-1)] = [[polylineLines[coordinateLocationInArray-1][0][0], polylineLines[coordinateLocationInArray-1][0][1]],[polylineLines[coordinateLocationInArray-1][1][0], polylineLines[coordinateLocationInArray-1][1][1]]];
                  window['polyline' + (coordinateLocationInArray-1)] = L.polyline( window['polyline' + (coordinateLocationInArray-1)],{color: 'lightgreen'}).addTo(mymapNL); 
                }
                mymapNL.removeLayer(window["polyline" + (coordinateLocationInArray)]);
                window['polyline' + (coordinateLocationInArray)] = [[polylineLines[coordinateLocationInArray][0][0], polylineLines[coordinateLocationInArray][0][1]],[polylineLines[coordinateLocationInArray][1][0], polylineLines[coordinateLocationInArray][1][1]]];
                window['polyline' + (coordinateLocationInArray)] = L.polyline( window['polyline' + (coordinateLocationInArray)],{color: 'lightgreen'}).addTo(mymapNL); 
                
                time = time + DuurPerPolyline;
                if(time >= 1)
                {
                  time = time -1;
                  TotaleDuurRoute = TotaleDuurRoute -1;
                }
                document.getElementsByClassName("RouteAfgelegdeAfstandNL")[0].innerHTML = (totaldistance/1000).toFixed(2)  + "km";
                document.getElementsByClassName("RouteTotaleAfstandNL")[0].innerHTML = GekozenRouteDistance;
                document.getElementsByClassName("RouteResterendeTijdNL")[0].innerHTML = TotaleDuurRoute;
              }
            }
            coordinateLocationInArray++;
          
            //-----------------------------------------------------------------------------------------------

          }
          else
          {
            console.log("je bent te ver van het punt");
          }
          console.log("afstadTussenPunten = " + afstadTussenPunten);
        }
        //kijken of de gebruiker op de bepaalde coordinaten is om de polyline achter hem groen te maken
        
      }
      else
      {
        console.log("geen coordinates");
      }
      //--------------------------------------------------------------------------------------------------
      
    }
    else
    {
      console.log("route niet gestart");
    }
  }
  else if(localStorage.getItem("GeselecteerdeTaal") == "FR")
  {
    console.log("locatie gevonden");
    if(localStorage.getItem("MapNLInitialised") == "true")
    {
      if (current_position) 
      {
        mymapFR.removeLayer(current_position);
      }
      latlng = 
      {
        lat: e.coords.latitude,
        lng: e.coords.longitude
      };
      lat = e.coords.latitude;
      long = e.coords.longitude;
      current_position = L.marker(latlng).addTo(mymapFR);
    }
    if(localStorage.getItem("RouteStart") == "true")
    {
      //---------------------------------------------------------------------------------------
      if(polylineLines != undefined)
      {
        if(polylineLines != "")
        {
          //console.log(window["polyline" + (coordinateLocationInArray)]);
          punt1Lat = e.coords.latitude;
          punt1Lng = e.coords.longitude
          punt2Lat = polylineCoords[coordinateLocationInArray].lat;
          punt2Lng = polylineCoords[coordinateLocationInArray].lng;

          var afstadTussenPunten = BerekenAfstandTussenPunt(punt1Lat, punt1Lng, punt2Lat, punt2Lng);
          
          if(afstadTussenPunten <20)
          {
            console.log("je bent binnen 20 meter van het punt");
            if(coordinateLocationInArray == polylineLines.length)
            {
              totaldistance = 0;
              console.log("route finished");
              localStorage.removeItem("polyline");
              polylineLines = [];
              polylineCoords = [];
              coordinateLocationInArray = 0;
              document.getElementById("mapidFR").style.height = "90%";
              document.getElementsByClassName("btnRouteFR")[0].style.display = "block";
              document.getElementsByClassName("BeforeRouteFR")[0].style.display = 'none';
              document.getElementsByClassName("KiesRouteDivFR")[0].style.display = 'block';
              document.getElementsByClassName("RouteInfoFR")[0].style.display = "none";
              for(var key in window)
              {
                if(key.includes("polyline"))
                {
                  if(hasNumber.test(key) == true)
                  {
                    if(window[key].options.color == "yellow" || window[key].options.color == "orange" || window[key].options.color == "lightgreen")
                    {
                      mymapFR.removeLayer(window[key]);
                    }
                  }
                }
              }
            }
            //-----------------------------------------------------------------------------------------------
            // ------------------------DISTANCE BEREKENEN----------------------------
            var punt1;
            var punt2;
            //console.log(coordinatesToCalculate[i].lat);
            punt1 = [polylineLines[coordinateLocationInArray][0][0], polylineLines[coordinateLocationInArray][0][1]];
            punt2 = [polylineLines[coordinateLocationInArray][1][0], polylineLines[coordinateLocationInArray][1][1]];
            
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
            totaldistance = totaldistance + d;
            console.log("d = " + totaldistance);
            //-----------------------------------------------------------------------
            
            //console.log("coordinateLocationInArray: " +coordinateLocationInArray );
            //  mymap.removeLayer(window["polyline" + (coordinateLocationInArray+1)]);
            if((coordinateLocationInArray + 1) !=  polylineLines.length || (coordinateLocationInArray + 1) >  polylineLines.length)
            {
              mymapFR.removeLayer(window["polyline" + (coordinateLocationInArray+1)]);
              window['polyline' + (coordinateLocationInArray+1)] = [[polylineLines[coordinateLocationInArray+1][0][0], polylineLines[coordinateLocationInArray+1][0][1]],[polylineLines[coordinateLocationInArray+1][1][0], polylineLines[coordinateLocationInArray+1][1][1]]];
              window['polyline' + (coordinateLocationInArray+1)] = L.polyline( window['polyline' + (coordinateLocationInArray+1)],{color: 'yellow'}).addTo(mymapFR);
            }
            if(coordinateLocationInArray+1 !=  (polylineLines.length + 1))
            {
              if(coordinateLocationInArray>0)
              {
                if(coordinateLocationInArray == 1)
                {
                  //mymapNL.removeLayer(window["polyline" + (coordinateLocationInArray-1)]);
                  window['polyline' + (coordinateLocationInArray-1)] = [[polylineLines[coordinateLocationInArray-1][0][0], polylineLines[coordinateLocationInArray-1][0][1]],[polylineLines[coordinateLocationInArray-1][1][0], polylineLines[coordinateLocationInArray-1][1][1]]];
                  window['polyline' + (coordinateLocationInArray-1)] = L.polyline( window['polyline' + (coordinateLocationInArray-1)],{color: 'lightgreen'}).addTo(mymapFR); 
                }
                mymapFR.removeLayer(window["polyline" + (coordinateLocationInArray)]);
                window['polyline' + (coordinateLocationInArray)] = [[polylineLines[coordinateLocationInArray][0][0], polylineLines[coordinateLocationInArray][0][1]],[polylineLines[coordinateLocationInArray][1][0], polylineLines[coordinateLocationInArray][1][1]]];
                window['polyline' + (coordinateLocationInArray)] = L.polyline( window['polyline' + (coordinateLocationInArray)],{color: 'lightgreen'}).addTo(mymapFR); 
                
                time = time + DuurPerPolyline;
                if(time >= 1)
                {
                  time = time -1;
                  TotaleDuurRoute = TotaleDuurRoute -1;
                }
                document.getElementsByClassName("RouteAfgelegdeAfstandFR")[0].innerHTML = (totaldistance/1000).toFixed(2)  + "km";
                document.getElementsByClassName("RouteTotaleAfstandFR")[0].innerHTML = GekozenRouteDistance;
                document.getElementsByClassName("RouteResterendeTijdFR")[0].innerHTML = TotaleDuurRoute;
              }
            }
            coordinateLocationInArray++;
          
            //-----------------------------------------------------------------------------------------------

          }
          else
          {
            console.log("je bent te ver van het punt");
          }
          console.log("afstadTussenPunten = " + afstadTussenPunten);
        }
        //kijken of de gebruiker op de bepaalde coordinaten is om de polyline achter hem groen te maken
        
      }
      else
      {
        console.log("geen coordinates");
      }
      //--------------------------------------------------------------------------------------------------
      
    }
    else
    {
      console.log("route niet gestart");
    }
  }
  else if(localStorage.getItem("GeselecteerdeTaal") == "ENG")
  {
    console.log("locatie gevonden");
    if(localStorage.getItem("MapNLInitialised") == "true")
    {
      if (current_position) 
      {
        mymapENG.removeLayer(current_position);
      }
      latlng = 
      {
        lat: e.coords.latitude,
        lng: e.coords.longitude
      };
      lat = e.coords.latitude;
      long = e.coords.longitude;
      current_position = L.marker(latlng).addTo(mymapENG);
    }
    if(localStorage.getItem("RouteStart") == "true")
    {
      //---------------------------------------------------------------------------------------
      if(polylineLines != undefined)
      {
        if(polylineLines != "")
        {
          //console.log(window["polyline" + (coordinateLocationInArray)]);
          punt1Lat = e.coords.latitude;
          punt1Lng = e.coords.longitude
          punt2Lat = polylineCoords[coordinateLocationInArray].lat;
          punt2Lng = polylineCoords[coordinateLocationInArray].lng;

          var afstadTussenPunten = BerekenAfstandTussenPunt(punt1Lat, punt1Lng, punt2Lat, punt2Lng);
          
          if(afstadTussenPunten <20)
          {
            console.log("je bent binnen 20 meter van het punt");
            console.log("lng: " + polylineCoords[coordinateLocationInArray].lng + "lat" + polylineCoords[coordinateLocationInArray].lat);
            console.log(coordinateLocationInArray);
            if(coordinateLocationInArray == polylineLines.length)
            {
              totaldistance = 0;
              console.log("route finished");
              localStorage.removeItem("polyline");
              polylineLines = [];
              polylineCoords = [];
              coordinateLocationInArray = 0;
              document.getElementById("mapidENG").style.height = "90%";
              document.getElementsByClassName("btnRouteENG")[0].style.display = "block";
              document.getElementsByClassName("BeforeRouteENG")[0].style.display = 'none';
              document.getElementsByClassName("KiesRouteDivENG")[0].style.display = 'block';
              document.getElementsByClassName("RouteInfoENG")[0].style.display = "none";
              for(var key in window)
              {
                if(key.includes("polyline"))
                {
                  if(hasNumber.test(key) == true)
                  {
                    if(window[key].options.color == "yellow" || window[key].options.color == "orange" || window[key].options.color == "lightgreen")
                    {
                      mymapENG.removeLayer(window[key]);
                    }
                  }
                }
              }
            }
            //-----------------------------------------------------------------------------------------------
            // ------------------------DISTANCE BEREKENEN----------------------------
            var punt1;
            var punt2;
            //console.log(coordinatesToCalculate[i].lat);
            punt1 = [polylineLines[coordinateLocationInArray][0][0], polylineLines[coordinateLocationInArray][0][1]];
            punt2 = [polylineLines[coordinateLocationInArray][1][0], polylineLines[coordinateLocationInArray][1][1]];
            
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
            totaldistance = totaldistance + d;
            console.log("d = " + totaldistance);
            //-----------------------------------------------------------------------
            
            //console.log("coordinateLocationInArray: " +coordinateLocationInArray );
            //  mymap.removeLayer(window["polyline" + (coordinateLocationInArray+1)]);
            if((coordinateLocationInArray + 1) !=  polylineLines.length || (coordinateLocationInArray + 1) >  polylineLines.length)
            {
              mymapENG.removeLayer(window["polyline" + (coordinateLocationInArray+1)]);
              window['polyline' + (coordinateLocationInArray+1)] = [[polylineLines[coordinateLocationInArray+1][0][0], polylineLines[coordinateLocationInArray+1][0][1]],[polylineLines[coordinateLocationInArray+1][1][0], polylineLines[coordinateLocationInArray+1][1][1]]];
              window['polyline' + (coordinateLocationInArray+1)] = L.polyline( window['polyline' + (coordinateLocationInArray+1)],{color: 'yellow'}).addTo(mymapENG);
            }
            if(coordinateLocationInArray+1 !=  (polylineLines.length + 1))
            {
              if(coordinateLocationInArray>0)
              {
                if(coordinateLocationInArray == 1)
                {
                  //mymapNL.removeLayer(window["polyline" + (coordinateLocationInArray-1)]);
                  window['polyline' + (coordinateLocationInArray-1)] = [[polylineLines[coordinateLocationInArray-1][0][0], polylineLines[coordinateLocationInArray-1][0][1]],[polylineLines[coordinateLocationInArray-1][1][0], polylineLines[coordinateLocationInArray-1][1][1]]];
                  window['polyline' + (coordinateLocationInArray-1)] = L.polyline( window['polyline' + (coordinateLocationInArray-1)],{color: 'lightgreen'}).addTo(mymapENG); 
                }
                mymapENG.removeLayer(window["polyline" + (coordinateLocationInArray)]);
                window['polyline' + (coordinateLocationInArray)] = [[polylineLines[coordinateLocationInArray][0][0], polylineLines[coordinateLocationInArray][0][1]],[polylineLines[coordinateLocationInArray][1][0], polylineLines[coordinateLocationInArray][1][1]]];
                window['polyline' + (coordinateLocationInArray)] = L.polyline( window['polyline' + (coordinateLocationInArray)],{color: 'lightgreen'}).addTo(mymapENG); 
                
                time = time + DuurPerPolyline;
                if(time >= 1)
                {
                  time = time -1;
                  TotaleDuurRoute = TotaleDuurRoute -1;
                }
                document.getElementsByClassName("RouteAfgelegdeAfstandENG")[0].innerHTML = (totaldistance/1000).toFixed(2)  + "km";
                document.getElementsByClassName("RouteTotaleAfstandENG")[0].innerHTML = GekozenRouteDistance;
                document.getElementsByClassName("RouteResterendeTijdENG")[0].innerHTML = TotaleDuurRoute;
              }
            }
            coordinateLocationInArray++;
          
            //-----------------------------------------------------------------------------------------------

          }
          else
          {
            console.log("je bent te ver van het punt");
          }
          console.log("afstadTussenPunten = " + afstadTussenPunten);
        }
        //kijken of de gebruiker op de bepaalde coordinaten is om de polyline achter hem groen te maken
        
      }
      else
      {
        console.log("geen coordinates");
      }
      //--------------------------------------------------------------------------------------------------
      
    }
    else
    {
      console.log("route niet gestart");
    }
  }
  
}
function onLocationError(e) {
  console.log("Location error: " + JSON.stringify(e));
}
function RouteDistanceBerekenen(coordinates)
{
  var coordinatesToCalculate = coordinates;
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
      //console.log("distance in meter: " + d); // returns the distance in meter
    }
  }
  //console.log("totale distance: " + puntdistance);
  return puntdistance;

}
function ReverseRoute()
{
  var endOfRoute = coords.length;
  if(localStorage.getItem("GeselecteerdeTaal") == "NL")
  {
    if(localStorage.getItem("Reverse") == "true")
    {
      mymapNL.removeLayer(window["polyline" + (1)]);
      mymapNL.removeLayer(window["polyline" + (2)]);
      mymapNL.removeLayer(window["polyline" + (endOfRoute-1)]);
      mymapNL.removeLayer(window["polyline" + (endOfRoute-2)]);
      window['polyline' + (endOfRoute-1)] = [[coords[endOfRoute-2].lat, coords[endOfRoute-2].lng],[coords[endOfRoute-1].lat, coords[endOfRoute-1].lng]];
      window['polyline' + (endOfRoute-1)] = L.polyline( window['polyline' +(endOfRoute-1)]).addTo(mymapNL); 
      window['polyline' + (endOfRoute-1)].setStyle(
      {
        color: 'yellow'
      }); 
      window['polyline' + (endOfRoute-2)] = [[coords[endOfRoute-3].lat, coords[endOfRoute-3].lng],[coords[endOfRoute-2].lat, coords[endOfRoute-2].lng]];
      window['polyline' + (endOfRoute-2)] = L.polyline( window['polyline' + (endOfRoute-2)]).addTo(mymapNL); 
      window['polyline' + (endOfRoute-2)].setStyle(
      {
        color: 'yellow'
      }); 
  
      
      window['polyline' + 1] = [[coords[0].lat, coords[0].lng],[coords[1].lat, coords[1].lng]];
      window['polyline' + 1] = L.polyline( window['polyline' + 1]).addTo(mymapNL); 
      window['polyline' + 1].setStyle(
      {
        color: 'orange'
      }); 
      window['polyline' + 2] = [[coords[1].lat, coords[1].lng],[coords[2].lat, coords[2].lng]];
      window['polyline' + 2] = L.polyline( window['polyline' + 2]).addTo(mymapNL); 
      window['polyline' + 2].setStyle(
      {
        color: 'orange'
      }); 
  
  
      localStorage.setItem("Reverse","false");
      mymapNL.removeLayer(StartMarker);
      coords.reverse();
      StartMarker = L.marker([coords[0].lat,coords[0].lng], {icon: StartIcon});
      mymapNL.addLayer(StartMarker);
      polylineLines.reverse();
    }
    else if(localStorage.getItem("Reverse") == "false")
    {
  
      mymapNL.removeLayer(window["polyline" + (1)]);
      mymapNL.removeLayer(window["polyline" + (2)]);
      window['polyline' + 1] = [[coords[0].lat, coords[0].lng],[coords[1].lat, coords[1].lng]];
      window['polyline' + 1] = L.polyline( window['polyline' + 1]).addTo(mymapNL); 
      window['polyline' + 1].setStyle(
      {
        color: 'orange'
      }); 
      window['polyline' + 2] = [[coords[1].lat, coords[1].lng],[coords[2].lat, coords[2].lng]];
      window['polyline' + 2] = L.polyline( window['polyline' + 2]).addTo(mymapNL); 
      window['polyline' + 2].setStyle(
      {
        color: 'orange'
      }); 
  
      mymapNL.removeLayer(window["polyline" + (endOfRoute-1)]);
      mymapNL.removeLayer(window["polyline" + (endOfRoute-2)]);
      window['polyline' + (endOfRoute-1)] = [[coords[endOfRoute-2].lat, coords[endOfRoute-2].lng],[coords[endOfRoute-1].lat, coords[endOfRoute-1].lng]];
      window['polyline' + (endOfRoute-1)] = L.polyline( window['polyline' +(endOfRoute-1)]).addTo(mymapNL); 
      window['polyline' + (endOfRoute-1)].setStyle(
      {
        color: 'yellow'
      }); 
      window['polyline' + (endOfRoute-2)] = [[coords[endOfRoute-3].lat, coords[endOfRoute-3].lng],[coords[endOfRoute-2].lat, coords[endOfRoute-2].lng]];
      window['polyline' + (endOfRoute-2)] = L.polyline( window['polyline' + (endOfRoute-2)]).addTo(mymapNL); 
      window['polyline' + (endOfRoute-2)].setStyle(
      {
        color: 'yellow'
      }); 
      
  
      localStorage.setItem("Reverse","true");
      mymapNL.removeLayer(StartMarker);
      coords.reverse();
      StartMarker = L.marker([coords[0].lat,coords[0].lng], {icon: StartIcon});
      mymapNL.addLayer(StartMarker);
      polylineLines.reverse();
  
    }
  }
  else if(localStorage.getItem("GeselecteerdeTaal") == "FR")
  {
    if(localStorage.getItem("Reverse") == "true")
    {
      mymapFR.removeLayer(window["polyline" + (1)]);
      mymapFR.removeLayer(window["polyline" + (2)]);
      mymapFR.removeLayer(window["polyline" + (endOfRoute-1)]);
      mymapFR.removeLayer(window["polyline" + (endOfRoute-2)]);
      window['polyline' + (endOfRoute-1)] = [[coords[endOfRoute-2].lat, coords[endOfRoute-2].lng],[coords[endOfRoute-1].lat, coords[endOfRoute-1].lng]];
      window['polyline' + (endOfRoute-1)] = L.polyline( window['polyline' +(endOfRoute-1)]).addTo(mymapFR); 
      window['polyline' + (endOfRoute-1)].setStyle(
      {
        color: 'yellow'
      }); 
      window['polyline' + (endOfRoute-2)] = [[coords[endOfRoute-3].lat, coords[endOfRoute-3].lng],[coords[endOfRoute-2].lat, coords[endOfRoute-2].lng]];
      window['polyline' + (endOfRoute-2)] = L.polyline( window['polyline' + (endOfRoute-2)]).addTo(mymapFR); 
      window['polyline' + (endOfRoute-2)].setStyle(
      {
        color: 'yellow'
      }); 
  
      
      window['polyline' + 1] = [[coords[0].lat, coords[0].lng],[coords[1].lat, coords[1].lng]];
      window['polyline' + 1] = L.polyline( window['polyline' + 1]).addTo(mymapFR); 
      window['polyline' + 1].setStyle(
      {
        color: 'orange'
      }); 
      window['polyline' + 2] = [[coords[1].lat, coords[1].lng],[coords[2].lat, coords[2].lng]];
      window['polyline' + 2] = L.polyline( window['polyline' + 2]).addTo(mymapFR); 
      window['polyline' + 2].setStyle(
      {
        color: 'orange'
      }); 
  
  
      localStorage.setItem("Reverse","false");
      mymapFR.removeLayer(StartMarker);
      coords.reverse();
      StartMarker = L.marker([coords[0].lat,coords[0].lng], {icon: StartIcon});
      mymapFR.addLayer(StartMarker);
      polylineLines.reverse();
    }
    else if(localStorage.getItem("Reverse") == "false")
    {
  
      mymapFR.removeLayer(window["polyline" + (1)]);
      mymapFR.removeLayer(window["polyline" + (2)]);
      window['polyline' + 1] = [[coords[0].lat, coords[0].lng],[coords[1].lat, coords[1].lng]];
      window['polyline' + 1] = L.polyline( window['polyline' + 1]).addTo(mymapFR); 
      window['polyline' + 1].setStyle(
      {
        color: 'orange'
      }); 
      window['polyline' + 2] = [[coords[1].lat, coords[1].lng],[coords[2].lat, coords[2].lng]];
      window['polyline' + 2] = L.polyline( window['polyline' + 2]).addTo(mymapFR); 
      window['polyline' + 2].setStyle(
      {
        color: 'orange'
      }); 
  
      mymapFR.removeLayer(window["polyline" + (endOfRoute-1)]);
      mymapFR.removeLayer(window["polyline" + (endOfRoute-2)]);
      window['polyline' + (endOfRoute-1)] = [[coords[endOfRoute-2].lat, coords[endOfRoute-2].lng],[coords[endOfRoute-1].lat, coords[endOfRoute-1].lng]];
      window['polyline' + (endOfRoute-1)] = L.polyline( window['polyline' +(endOfRoute-1)]).addTo(mymapFR); 
      window['polyline' + (endOfRoute-1)].setStyle(
      {
        color: 'yellow'
      }); 
      window['polyline' + (endOfRoute-2)] = [[coords[endOfRoute-3].lat, coords[endOfRoute-3].lng],[coords[endOfRoute-2].lat, coords[endOfRoute-2].lng]];
      window['polyline' + (endOfRoute-2)] = L.polyline( window['polyline' + (endOfRoute-2)]).addTo(mymapFR); 
      window['polyline' + (endOfRoute-2)].setStyle(
      {
        color: 'yellow'
      }); 
      
  
      localStorage.setItem("Reverse","true");
      mymapFR.removeLayer(StartMarker);
      coords.reverse();
      StartMarker = L.marker([coords[0].lat,coords[0].lng], {icon: StartIcon});
      mymapFR.addLayer(StartMarker);
      polylineLines.reverse();
  
    }
  }
  else if(localStorage.getItem("GeselecteerdeTaal") == "ENG")
  {
    if(localStorage.getItem("Reverse") == "true")
    {
      mymapENG.removeLayer(window["polyline" + (1)]);
      mymapENG.removeLayer(window["polyline" + (2)]);
      mymapENG.removeLayer(window["polyline" + (endOfRoute-1)]);
      mymapENG.removeLayer(window["polyline" + (endOfRoute-2)]);
      window['polyline' + (endOfRoute-1)] = [[coords[endOfRoute-2].lat, coords[endOfRoute-2].lng],[coords[endOfRoute-1].lat, coords[endOfRoute-1].lng]];
      window['polyline' + (endOfRoute-1)] = L.polyline( window['polyline' +(endOfRoute-1)]).addTo(mymapENG); 
      window['polyline' + (endOfRoute-1)].setStyle(
      {
        color: 'yellow'
      }); 
      window['polyline' + (endOfRoute-2)] = [[coords[endOfRoute-3].lat, coords[endOfRoute-3].lng],[coords[endOfRoute-2].lat, coords[endOfRoute-2].lng]];
      window['polyline' + (endOfRoute-2)] = L.polyline( window['polyline' + (endOfRoute-2)]).addTo(mymapENG); 
      window['polyline' + (endOfRoute-2)].setStyle(
      {
        color: 'yellow'
      }); 
  
      
      window['polyline' + 1] = [[coords[0].lat, coords[0].lng],[coords[1].lat, coords[1].lng]];
      window['polyline' + 1] = L.polyline( window['polyline' + 1]).addTo(mymapENG); 
      window['polyline' + 1].setStyle(
      {
        color: 'orange'
      }); 
      window['polyline' + 2] = [[coords[1].lat, coords[1].lng],[coords[2].lat, coords[2].lng]];
      window['polyline' + 2] = L.polyline( window['polyline' + 2]).addTo(mymapENG); 
      window['polyline' + 2].setStyle(
      {
        color: 'orange'
      }); 
  
  
      localStorage.setItem("Reverse","false");
      mymapENG.removeLayer(StartMarker);
      coords.reverse();
      StartMarker = L.marker([coords[0].lat,coords[0].lng], {icon: StartIcon});
      mymapENG.addLayer(StartMarker);
      polylineLines.reverse();
    }
    else if(localStorage.getItem("Reverse") == "false")
    {
  
      mymapENG.removeLayer(window["polyline" + (1)]);
      mymapENG.removeLayer(window["polyline" + (2)]);
      window['polyline' + 1] = [[coords[0].lat, coords[0].lng],[coords[1].lat, coords[1].lng]];
      window['polyline' + 1] = L.polyline( window['polyline' + 1]).addTo(mymapENG); 
      window['polyline' + 1].setStyle(
      {
        color: 'orange'
      }); 
      window['polyline' + 2] = [[coords[1].lat, coords[1].lng],[coords[2].lat, coords[2].lng]];
      window['polyline' + 2] = L.polyline( window['polyline' + 2]).addTo(mymapENG); 
      window['polyline' + 2].setStyle(
      {
        color: 'orange'
      }); 
  
      mymapENG.removeLayer(window["polyline" + (endOfRoute-1)]);
      mymapENG.removeLayer(window["polyline" + (endOfRoute-2)]);
      window['polyline' + (endOfRoute-1)] = [[coords[endOfRoute-2].lat, coords[endOfRoute-2].lng],[coords[endOfRoute-1].lat, coords[endOfRoute-1].lng]];
      window['polyline' + (endOfRoute-1)] = L.polyline( window['polyline' +(endOfRoute-1)]).addTo(mymapENG); 
      window['polyline' + (endOfRoute-1)].setStyle(
      {
        color: 'yellow'
      }); 
      window['polyline' + (endOfRoute-2)] = [[coords[endOfRoute-3].lat, coords[endOfRoute-3].lng],[coords[endOfRoute-2].lat, coords[endOfRoute-2].lng]];
      window['polyline' + (endOfRoute-2)] = L.polyline( window['polyline' + (endOfRoute-2)]).addTo(mymapENG); 
      window['polyline' + (endOfRoute-2)].setStyle(
      {
        color: 'yellow'
      }); 
      
  
      localStorage.setItem("Reverse","true");
      mymapENG.removeLayer(StartMarker);
      coords.reverse();
      StartMarker = L.marker([coords[0].lat,coords[0].lng], {icon: StartIcon});
      mymapENG.addLayer(StartMarker);
      polylineLines.reverse();
  
    }
  }
}
function StartRoute()
{
 
  if(localStorage.getItem("GeselecteerdeTaal") == "NL")
  {
    if (Framework7.device.ios) 
    {
      document.getElementsByClassName("RouteInfoNL")[0].style.marginTop = "-29%";
    }
    else
    {
      document.getElementsByClassName("RouteInfoNL")[0].style.marginTop = "-22%";
    }
    document.getElementsByClassName("DuringRouteNameNL")[0].innerHTML = localStorage.getItem("GekozenRouteName");
    document.getElementsByClassName("BeforeRouteNL")[0].style.display = 'none';
    document.getElementsByClassName("RouteInfoNL")[0].style.display = 'block';
    mymapNL.removeLayer(StartMarker);
  }
  else if(localStorage.getItem("GeselecteerdeTaal") == "FR")
  {
    if (Framework7.device.ios) 
    {
      document.getElementsByClassName("RouteInfoFR")[0].style.marginTop = "-29%";
    }
    else
    {
      document.getElementsByClassName("RouteInfoFR")[0].style.marginTop = "-22%";
    }
    document.getElementsByClassName("DuringRouteNameFR")[0].innerHTML = localStorage.getItem("GekozenRouteName");
    document.getElementsByClassName("BeforeRouteFR")[0].style.display = 'none';
    document.getElementsByClassName("RouteInfoFR")[0].style.display = 'block';
    mymapFR.removeLayer(StartMarker);
  }
  else if(localStorage.getItem("GeselecteerdeTaal") == "ENG")
  {
    if (Framework7.device.ios) 
    {
      document.getElementsByClassName("RouteInfoENG")[0].style.marginTop = "-29%";
    }
    else
    {
      document.getElementsByClassName("RouteInfoENG")[0].style.marginTop = "-22%";
    }
    document.getElementsByClassName("DuringRouteNameENG")[0].innerHTML = localStorage.getItem("GekozenRouteName");
    document.getElementsByClassName("BeforeRouteENG")[0].style.display = 'none';
    document.getElementsByClassName("RouteInfoENG")[0].style.display = 'block';
    mymapENG.removeLayer(StartMarker);
  }
  localStorage.setItem("RouteStart","true");
  coordinateLocationInArray = 0;
  
}
function StopRoute()
{
  console.log("stop route");
  if(localStorage.getItem("GeselecteerdeTaal") == "NL")
  {
    document.getElementById("mapidNL").style.height = "90%";
    document.getElementsByClassName("btnRouteNL")[0].style.display = "block";
    document.getElementsByClassName("BeforeRouteNL")[0].style.display = 'none';
    document.getElementsByClassName("KiesRouteDivNL")[0].style.display = 'block';
    document.getElementsByClassName("RouteInfoNL")[0].style.display = "none";
    mymapNL.removeLayer(StartMarker);
    var aantalLines = localStorage.getItem("polyline").length;
    for(var key in window)
    {
      if(key.includes("polyline"))
      {
        if(hasNumber.test(key) == true)
        {
          if(window[key].options.color == "yellow" || window[key].options.color == "orange" || window[key].options.color == "lightgreen")
          {
            mymapNL.removeLayer(window[key]);
          }
          //console.log(key);
        }
        //console.log("y = " + key);
      }
      else
      {
  
      }
      
    }
  }
  else if(localStorage.getItem("GeselecteerdeTaal") == "FR")
  {
    document.getElementById("mapidFR").style.height = "90%";
    document.getElementsByClassName("btnRouteFR")[0].style.display = "block";
    document.getElementsByClassName("BeforeRouteFR")[0].style.display = 'none';
    document.getElementsByClassName("KiesRouteDivFR")[0].style.display = 'block';
    document.getElementsByClassName("RouteInfoFR")[0].style.display = "none";
    mymapFR.removeLayer(StartMarker);
    var aantalLines = localStorage.getItem("polyline").length;
    for(var key in window)
    {
      if(key.includes("polyline"))
      {
        if(hasNumber.test(key) == true)
        {
          if(window[key].options.color == "yellow" || window[key].options.color == "orange" || window[key].options.color == "lightgreen")
          {
            mymapFR.removeLayer(window[key]);
          }
          //console.log(key);
        }
        //console.log("y = " + key);
      }
      else
      {
  
      }
      
    }
  }
  else if(localStorage.getItem("GeselecteerdeTaal") == "ENG")
  {
    document.getElementById("mapidENG").style.height = "90%";
    document.getElementsByClassName("btnRouteENG")[0].style.display = "block";
    document.getElementsByClassName("BeforeRouteENG")[0].style.display = 'none';
    document.getElementsByClassName("KiesRouteDivENG")[0].style.display = 'block';
    document.getElementsByClassName("RouteInfoENG")[0].style.display = "none";
    mymapENG.removeLayer(StartMarker);
    var aantalLines = localStorage.getItem("polyline").length;
    for(var key in window)
    {
      if(key.includes("polyline"))
      {
        if(hasNumber.test(key) == true)
        {
          if(window[key].options.color == "yellow" || window[key].options.color == "orange" || window[key].options.color == "lightgreen")
          {
            mymapENG.removeLayer(window[key]);
          }
          //console.log(key);
        }
        //console.log("y = " + key);
      }
      else
      {
  
      }
      
    }
  }
  polylineLines = [];
  polylineCoords = [];
  coords = [];
  totaldistance = 0;
  coordinateLocationInArray = 0;
  localStorage.removeItem("polyline");
}
function BerekenAfstandTussenPunt(puntaLat, puntaLng, puntbLat, puntbLng)
{
  var punt1lat = puntaLat;
  var punt1lng = puntaLng;
  var punt2lat = puntbLat;
  var punt2lng = puntbLng;
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
  return d;
}
navigator.geolocation.watchPosition(onLocationFound, onLocationError, {
  maximumAge: 1000,
  timeout: 3000,
  enableHighAccuracy: true
});

function MeldProbleem()
{
  if(localStorage.getItem("InternetStatus") == "Online")
  {
    
    app.dialog.progress('Mail versturen');
    var div = document.getElementById("emailScript");
    var firebaseScript1 = document.createElement("script");
    firebaseScript1.src = "https://smtpjs.com/v3/smtp.js";
    div.appendChild(firebaseScript1);
    app.dialog.close();
  }
  else
  {
    alert("Gelieve uw 4G aan te zetten");
  }
  var title = document.getElementById("titelInput").value;
  var bescrhijving = document.getElementById("bescrhijving").value;
  var locationShare;
  if(document.querySelector('#opta:checked') !== null)
  {
    locationShare = "true";
    console.log("checked");
    console.log("title = " + title);
    console.log("bescrhijving = " + bescrhijving);
    Email.send({
      Host: "smtp.gmail.com",
      Username : "driesvanransbeeck15@gmail.com",
      Password : "",
      To : 'dries.van.ransbeeck@hotmail.com',
      From : "driesvanransbeeck15@gmail.com",
      Subject : title,
      Body : bescrhijving,
      }).then(
         alert("mail sent successfully")
      );
  }
  else
  {
    console.log("not checked");
  }
  
}
function LanuageChange(id)
{
  
  
  localStorage.setItem("MapNLInitialised","false");
  localStorage.setItem("MapFRInitialised","false");
  localStorage.setItem("MapENGInitialised","false");
  try
  {
    mymap.removeLayer(StartMarker);
  }
  catch(err)
  {
    console.log("language change err: " + err);
  }
  try
  {
    for(var key in window)
    {
      if(key.includes("polyline"))
      {
        if(hasNumber.test(key) == true)
        {
          if(window[key].options.color == "yellow" || window[key].options.color == "orange" || window[key].options.color == "lightgreen")
          {
            mymap.removeLayer(window[key]);
          }
          //console.log(key);
        }
        //console.log("y = " + key);
      }
      else
      {
  
      }
    }
  }
  catch(err)
  {
    console.log("language change polyline err: " + err);

  }
 
  polylineLines = [];
  polylineCoords = [];
  coords = [];
  totaldistance = 0;
  coordinateLocationInArray = 0;
  localStorage.removeItem("polyline");
  localStorage.setItem("GeselecteerdeTaal",id);
}