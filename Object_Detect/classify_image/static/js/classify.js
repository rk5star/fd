$(document).ready(function() {

  var dropContainer = document.getElementById('drop-container');
  dropContainer.ondragover = dropContainer.ondragend = function() {
    return false;
  };
var imagefile=null;

  dropContainer.ondrop = function(e) {
    e.preventDefault();
	imagefile=e.dataTransfer.files[0];
    loadImage(e.dataTransfer.files[0])
  }

  $("#browse-button").change(function() {
    loadImage($("#browse-button").prop("files")[0]);
  });

  $('.modal').modal({
    dismissible: false,
    ready: function(modal, trigger) {
      $.ajax({
        type: "POST",
        url: '/classify_image/classify/api/',
        data: {
          'image64': $('#img-card').attr('src')
        },
        dataType: 'text',
        success: function(data) {
          loadStats(data)
        },
		error: function(request, status,error){
			 alert("Please use another image");
			 location.reload();
		}
      }).always(function() {
        modal.modal('close');
      });
    }
  });

  $('#go-back, #go-start').click(function() {
    $('#img-card').removeAttr("src");
    $('#stat-table').html('');
    switchCard(0);
  });

  $('#upload-button').click(function() {
    $('.modal').modal('open');
  });
});

switchCard = function(cardNo) {
  var containers = [".dd-container", ".uf-container", ".dt-container"];
  var visibleContainer = containers[cardNo];
  for (var i = 0; i < containers.length; i++) {
    var oz = (containers[i] === visibleContainer) ? '1' : '0';
    $(containers[i]).animate({
      opacity: oz
    }, {
      duration: 200,
      queue: false,
    }).css("z-index", oz);
  }
}

loadImage = function(file) {
  var reader = new FileReader();
  reader.onload = function(event) {
    $('#img-card').attr('src', event.target.result);
	
  }
  reader.readAsDataURL(file);
  switchCard(1);
}

loadStats = function(jsonData) 
{
	var perc=0;
	
	var img=$('.uf-card').html();
	switchCard(2);
	$('.uf-container').css("z-index",1);
	var data = JSON.parse(jsonData);

	var bluecol=data["blue_color"];
	var redcolor=data["red_color"];
	console.log(bluecol);
	if(redcolor=="Yes")
	{
		var watteMarkup=`
			<div class="card">
			<div class="card-content black-text stat-card">
			<div class="row">
			<div class="col s6"><h5 style="
			line-height: 3.4rem;
			">Wattle present: </h5></div><div class="col s2 offset-s4"><h4 style="color:Red;">`+redcolor+`</h4></div></div>
			</div>

			</div>`;
		$("#stat-table").append(watteMarkup);
  
	}
	else{
		var watteMarkup=`
			<div class="card">
			<div class="card-content black-text stat-card">
			<div class="row">
			<div class="col s6"><h5 style="
			line-height: 3.4rem;
			">Wattle present: </h5></div><div class="col s2 offset-s4"><h4 style="color:Red;">`+"No"+`</h4></div></div>
			</div>

			</div>`;
		$("#stat-table").append(watteMarkup);
  
	}
	if(data["success"]==true){
		var count=0
		var pcount=0;
		for (category in data['confidence'])
		{
			var percent = Math.round(parseFloat(data["confidence"][category]) * 100);
			if(percent<=70 && bluecol=="Yes" && count==0)
			{
				count=1;
				var objMarkup=`
					<div class="card c1">
					<div class="card-content black-text stat-card">
					<div class="row">
					<div class="col s6"><h5 style="
					line-height: 3.4rem;
					">Colored object present: </h5></div><div class="col s2 offset-s4"><h4 style="color:Red;">`+"Yes"+`</h4></div></div>
					</div>

					</div>`;
				$("#stat-table").append(objMarkup);
			}
			else if(count==0){
				count=1;
				var objMarkup=`
					<div class="card c2">
					<div class="card-content black-text stat-card">
					<div class="row">
					<div class="col s6"><h5 style="
					line-height: 3.4rem;
					">Colored object present: </h5></div><div class="col s2 offset-s4"><h4 style="color:Red;">`+"No"+`</h4></div></div>
					</div>

					</div>`;
				$("#stat-table").append(objMarkup);
				
			}
			if((percent>=70||percent==67) && pcount==0)
			{
				pcount=1;
				var bottleMarkup=`
					<div class="card c3">
					<div class="card-content black-text stat-card">
					<div class="row">
					
					<div class="col s6"><h5 style="
					line-height: 3.4rem;
					">Object present: </h5></div>
					<div class="col s2 offset-s4"><h4 style="color:Red;">`+"Yes-"+percent+`%</h4></div>
					</div>
					
					<div class="col s6"><h5 style="line-height: 3.4rem;">
					Type of Object: </h5></div>
					<div class="col s2 offset-s4"><h4 style="color:Red;">`+"Bottle"+`</h4></div>
					
					</div>

					</div>`;
				$("#stat-table").append(bottleMarkup);
			}
			else if(pcount==0){
				pcount=1;
				var bottleMarkup=`
					<div class="card c4">
					<div class="card-content black-text stat-card">
					<div class="row">
					<div class="col s6"><h5 style="
					line-height: 3.4rem;
					">Object present: </h5></div><div class="col s2 offset-s4"><h4 style="color:Red;">`+"No"+`</h4></div></div>
					</div>

					</div>`;	
				$("#stat-table").append(bottleMarkup);
				
			}
		}
	}
	
	
	
	
	  $("#stat-table").append(img);
}
	
  /* var blueMarkup=`
  <div class="card">
  <div class="card-content black-text stat-card">
  <div class="row">
      <div class="col s6"><h5 style="
    line-height: 3.4rem;
">Any Blue color object present: </h5></div><div class="col s2 offset-s4"><h4 style="color:Red;">`+bluecol+`</h4></div></div>
  </div>
  
  </div>`;
  $("#stat-table").append(blueMarkup);
  if (data["success"] == true) 
  {
	
    for (category in data['confidence']) 
	{
		
      var percent = Math.round(parseFloat(data["confidence"][category]) * 100);
	  if(percent>=60)
	  {
	
      var markup =`
	  <div class="card">
        <div class="card-content black-text stat-card">
		<div class="row">
      <div class="col s6"><h5 style="
    line-height: 3.4rem;
">Any Bottle Present in the picture: </h5></div><div class="col s2 offset-s4"><h4 style="color:Red;">Yes</h4></div></div>
    <div class="row">
		<div class="col s2"><h5 style="
    line-height: 3.4rem;
">Type of Bottle </h5></div>
    <div class="col s8 center-align"><span class="card-title capitalize" style="
    line-height: 4.5rem;
">`+category+`</span></div>
 <div class="col s1 "><p style="float: left;">Confidence: </p><h5 style="color:Red;"><p style="color: Red;"><b>`+percent+`%</b></p></h5></div>
</div>
</div>
        </div>
	  `;
      $("#stat-table").append(markup);
	  break;
	  }
	   else
  {
	  var noBottleMarkup=`
  <div class="card">
  <div class="card-content black-text stat-card">
  
      <div class="col s6"><h5 style="
    line-height: 3.4rem;
">Any Bottle Present in the picture: </h5></div><div class="col s2 offset-s4"><h4 style="color:Red;">No</h4></div></div>
  </div>
  
  </div>`;
  $("#stat-table").append(noBottleMarkup);
  break;
  } 
	  
    }
  }
  
  
  
  else
  {
	  var noBottleMarkup2=`
  <div class="card">
  <div class="card-content black-text stat-card">
  <div class="col s6"><h5 style="
    line-height: 3.4rem;
">Any Bottle Present in the picture: </h5></div><div class="col s2 offset-s4"><h4 style="color:Red;">No</h4></div></div>
  </div>
  </div>
  
  </div>`;
  $("#stat-table").append(noBottleMarkup2);
  } */


