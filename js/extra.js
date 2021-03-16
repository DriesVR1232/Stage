app.preloader.show();
var ref = firebase.database().ref('flamelink/environments/production/content/test/en-US');
ref.once("value", function(snapshot) 
{
  snapshot.forEach(function(child) 
  {
    var ref = firebase.database().ref('flamelink/environments/production/content/test/en-US/' + child.key );
    ref.on('value', (snapshot) => 
    {
      if(snapshot.exists())
      {
        app.preloader.hide();
        var data = snapshot.val();
        console.log(data);
        var div = document.createElement('div');
        div.innerHTML = 
        `
          <div class="card demo-card-header-pic">
          <a href="/Event/">
          <div style="background-image:url(https://cdn.framework7.io/placeholder/nature-1000x600-3.jpg)"
            class="card-header align-items-flex-end">` + data.title +`</div>
          </a>
          <div class="card-content card-content-padding">
            <p class="date">`+data.date + `</p>
            <p>`+data.information +`</p>
          </div>
          <!--<div class="card-footer"><a href="#" class="link">Like</a><a href="#" class="link">Read more</a></div>-->
          </div>
        `;

        document.getElementById('events').appendChild(div);
      }
      else
      {
        console.log("geen evenementen beschikbaar");
        var div = document.createElement('div');
        div.innerHTML = 
        `
        <p>Geen evenementen beschikbaar</p>
        `;
      }
      
    });
  });
});