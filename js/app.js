// Dom7
var $ = Dom7;

// Theme
var theme = 'auto';
if (document.location.search.indexOf('theme=') >= 0) {
  theme = document.location.search.split('theme=')[1].split('&')[0];
}

// Init App
var app = new Framework7({
  id: 'io.framework7.testapp',
  root: '#app',
  theme: theme,
  routes: routes,
});
// Store
localStorage.setItem("language", "nl");
function LanuageChange(x)
{
  var language = x;
  if(language == "ENG")
  {
    localStorage.setItem("language","eng");
  }
  else if(language == "FR")
  {
    localStorage.setItem("language","fr");
  }
  else if(language == "NL")
  {
    localStorage.setItem("language","nl");
  }
}

if (Framework7.device.ios) {
  console.log('It is iOS device');
}
else
{
  console.log("not IOS");
}

if (app.device.android) {
  console.log('It is android device');
}
else{
  console.log("not Android");
}
function test()
{
  onmouseleave.log("test werkt");
}
$(document).on('page:init', function (e, page) 
{
  var elementExists = document.getElementById("map");
  if(elementExists != null)
  {
    if(localStorage.getItem("language") == "nl")
    {
      mapboxgl.accessToken = 'pk.eyJ1IjoiZHJpZXNvZGlzZWUiLCJhIjoiY2trdjlubnNtMWYyYTJvcGN1YmZzZmp2eiJ9.vczXMcv4591crBq7pCgsYw';
      if ("geolocation" in navigator) 
      {
        navigator.geolocation.getCurrentPosition(position => { 
          var map = new mapboxgl.Map(
            {
              container: 'map',
              center: [position.coords.longitude, position.coords.latitude],
              zoom: 15,
              style: 'mapbox://styles/groenestapstenenvzw/cjsa2ljft5tgs1ftdjcqr09mo'
            }); 
            
          map.addControl(
            new mapboxgl.GeolocateControl(
            {
              positionOptions: 
              {
                enableHighAccuracy: true
              },
              trackUserLocation: true
            }),
          );
          
        })
      }
      else 
      { /* geolocation IS NOT available, handle it */ 
        console.log("geen geolocatie");
      }

    }
    else if(localStorage.getItem("language") == "fr")
    {
      mapboxgl.accessToken = 'pk.eyJ1IjoiZHJpZXNvZGlzZWUiLCJhIjoiY2trdjlubnNtMWYyYTJvcGN1YmZzZmp2eiJ9.vczXMcv4591crBq7pCgsYw';
      if ("geolocation" in navigator) 
      {
        navigator.geolocation.getCurrentPosition(position => { 
          var map = new mapboxgl.Map(
            {
              container: 'map',
              center: [position.coords.longitude, position.coords.latitude],
              zoom: 15,
              style: 'mapbox://styles/groenestapstenenvzw/cjsa2ljft5tgs1ftdjcqr09mo'
            }); 
            
          map.addControl(
            new mapboxgl.GeolocateControl(
            {
              positionOptions: 
              {
                enableHighAccuracy: true
              },
              trackUserLocation: true
            }),
          );
          
        })
      }
      else 
      { /* geolocation IS NOT available, handle it */ 
        console.log("geen geolocatie");
      }
    }
    else if(localStorage.getItem("language") == "eng")
    {
      mapboxgl.accessToken = 'pk.eyJ1IjoiZHJpZXNvZGlzZWUiLCJhIjoiY2trdjlubnNtMWYyYTJvcGN1YmZzZmp2eiJ9.vczXMcv4591crBq7pCgsYw';
      if ("geolocation" in navigator) 
      {
        navigator.geolocation.getCurrentPosition(position => { 
          var map = new mapboxgl.Map(
            {
              container: 'map',
              center: [position.coords.longitude, position.coords.latitude],
              zoom: 15,
              style: 'mapbox://styles/groenestapstenenvzw/cjsa2ljft5tgs1ftdjcqr09mo'
            }); 
            
          map.addControl(
            new mapboxgl.GeolocateControl(
            {
              positionOptions: 
              {
                enableHighAccuracy: true
              },
              trackUserLocation: true
            }),
          );
          
        })
      }
      else 
      { /* geolocation IS NOT available, handle it */ 
        console.log("geen geolocatie");
      }
    }
    
  }
  else
  {
    console.log("element bestaat niet");
  }
  console.log(page);
  
})
function LoadMapbox()
{
  
}
