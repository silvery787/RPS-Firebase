const SCORE_TIMEOUT = 5000;  
// Initialize Firebase
var config = {
  apiKey: "AIzaSyAxWKmqUYTP6iksBnYtqUVZzuvSLuzMNL4",
  authDomain: "rock-paper-scissors-62dce.firebaseapp.com",
  databaseURL: "https://rock-paper-scissors-62dce.firebaseio.com",
  projectId: "rock-paper-scissors-62dce",
  storageBucket: "",
  messagingSenderId: "729561173880"
};
firebase.initializeApp(config);

var db = firebase.database();

var room_id = 0;

var player = {
  id : 0, 
  name : "",
  wins : 0,
  looses : 0,
  choice : 0
}

var opponent = {
  id : 0, 
  name : "",
  wins : 0,
  looses : 0,
  choice : 0
};

//=================================== 
function clearButtons(){

  $("#player1").empty();
  $("#player2").empty();
  $("#game-result").empty(); 
  
  $("#p2name").text('disconnected');
  $("#p2score").empty();

}

function drawMyChoiceButtons(){
  
  if(player.id && opponent.id){
    drawPlayersInfo();

    $("#player1").empty();
    $("#player2").empty();
    $("#game-result").empty();

    //draw r p s
    var rock_btn = $("<button>");
    rock_btn.addClass("choice_btn");
    rock_btn.attr("data", "r");
    rock_btn.text("=Rock=");
    $("#player1").append(rock_btn);

    var paper_btn = $("<button>");
    paper_btn.addClass("choice_btn");
    paper_btn.attr("data", "p");
    paper_btn.text("=Paper=");
    $("#player1").append(paper_btn);

    var scissors_btn = $("<button>");
    scissors_btn.addClass("choice_btn");
    scissors_btn.attr("data", "s");
    scissors_btn.text("=Scissors=");
    $("#player1").append(scissors_btn);
  }
  else {
    clearButtons();
  }
}

function drawPlayersInfo(){

  $("#p1name").text(player.name);
  $("#p1score").text("wins: "+player.wins+" | looses: "+player.looses);

  $("#p2name").text(opponent.name);
  $("#p2score").text("wins: "+opponent.wins+" | looses: "+opponent.looses);

}

function getTextForChoice( choice ){
  switch(choice){
    case 'r' : return "=Rock=";
    case 'p' : return "=Paper=";
    case 's' : return "=Scissors=";
  }
}

function enterWaitList(){

//  db.ref('waiting').once('value', function(snapshot) {
  var query = db.ref('waiting').orderByKey();
  query.once('value').then( function(snapshot) {
    //var roomW = snapshot.val();
    //console.log(roomW);
    //if doesn't exist
    if( !snapshot.exists()){
      db.ref('waiting/'+player.id).set(0);
    }
    else {
      //waiting room exists
      //chack if there any any waiting player
      snapshot.forEach(function(childSnapshot) {
        var id = childSnapshot.key;
        var val = childSnapshot.val();
        if( id != player.id && val == 0 ){
          opponent.id = id;
          room_id = "room_"+Math.ceil(Math.random()*10000);
          return false;
        }
        if(room_id) return false;
      });

      console.log("Room = "+room_id);

      if( room_id != 0 ){// if opponent was found
        //create new room
        db.ref(room_id).set({
          players: 0,
          chat : ""
        });

        //add yourself to the new room
        //db.ref(room_id+'/players/'+player.id).set(player);

        //add room_id to opponent's id in waiting room
        db.ref('waiting/' + opponent.id).set(room_id);
        //add yourself to waiting with the same room_id
        db.ref('waiting/'+player.id).set(room_id);

      }
      else{
        //opponent.id is undefined yet
        //add yourself to waiting room with room value == 0
        db.ref('waiting/'+player.id).set(0);

      }
      query.off(); 
    }
  },
  function(error){
    console.log("error: "+error.code);
  });
  
}

function processOpponentDisconnect(){
  
  db.ref(room_id+'/players/'+opponent.id).once('child_removed').then( function(event){
    
    db.ref(room_id).remove();
    player.choice = 0;
    opponent = {};
    room_id = 0;
    
    clearButtons();

    enterWaitList();
  //   var query = db.ref("waiting").orderByKey();
  //   query.once("value").then(function(parentSnapshot) {
  //     parentSnapshot.forEach(function(childSnapshot) {
  //       var id = childSnapshot.key;
  //       var val = childSnapshot.val();
  //       if( id != player.id && val == 0 ){
  //         opponent.id = id;
  //         room_id = "room_"+Math.ceil(Math.random()*10000);
  //         return false;
  //       }
  //       if(room_id) return false;
  //       // return true;
  //     });

  //     console.log("Room = "+room_id);
  //     if(room_id!=0){// if opponent was found
  //       //create new room
  //       db.ref(room_id).set({
  //         players: 0,
  //         chat : ""
  //       });
  //       db.ref('waiting/' + opponent.id).set(room_id);
  //       db.ref('waiting/'+ player.id).set(room_id);
  //       //db.ref(room_id+'/players/'+player.id).set(player);
  //     }
  //     else{
  //       db.ref('waiting/'+player.id).set(0);

  //     }
  //     query.off(); 
  //   });
  });
}
//=========== CHOICE CLICK ==============

$("#player1").on("click", ".choice_btn", function(){

  player.choice = $(this).attr("data");
  console.log("p1-choice: "+player.choice);
  //draw/show a picture of choice 
  $("#player1").empty();
  var p1text = getTextForChoice( player.choice );
  $("#player1").text(p1text);
  //save choice to db
  db.ref(room_id+'/players/'+player.id).update({ choice: player.choice });

  opponent.choice = 0;

  db.ref(room_id+'/players/'+opponent.id+'/choice').on('value', function(snapshot){

    //console.log("opponent : "+opponent.id);
    opponent.choice = snapshot.val();
    //console.log("opponents choice: "+ opponent.choice);

    if( opponent.choice && player.choice ){

      // console.log("p2-choice: "+ opponent.choice);
      var p2text = getTextForChoice( opponent.choice );
      $("#player2").text(p2text);

      //check who is the winner
      if (player.choice == opponent.choice) {
        $("#game-result").text("Ties!");
      }
      else if( (player.choice == "r" && opponent.choice == "s") ||
        (player.choice == "p" && opponent.choice == "r") ||
        (player.choice == "s" && opponent.choice == "p")){
          $("#game-result").text("You Win!");
          player.wins++;
          opponent.looses++;
      }
      else{
        $("#game-result").text("You Loose!");
        player.looses++;
        opponent.wins++;
      } 

      opponent.choice = 0;
      player.choice = 0;

      db.ref(room_id+'/players/'+player.id).set(player);
      // db.ref(room_id+'/players/'+player.id+'/choice').set(0);
      // db.ref(room_id+'/players/'+player.id+'/wins').set(player.wins);
      // db.ref(room_id+'/players/'+player.id+'/looses').set(player.looses);

      setTimeout( drawMyChoiceButtons , SCORE_TIMEOUT );
      
    }
  }, 
    function(error){
      console.log(error.code);
  });

});//choice click

// ==== START BUTTON ===============

$("#btn-start").on("click", function(){
  event.preventDefault();
  
  player.name = $("#player-name").val().trim();

  var rnd = Math.ceil(Math.random()*10000);
  player.id = "" + player.name + rnd;

  game_started = 1;

  $("#start-form").hide();
  $("#greeting").text("Hi "+player.name);

  $("#p1name").text(player.name);
  $("#p1score").text("wins: "+player.wins+" | looses: "+player.looses);

  var waitRef = firebase.database().ref('waiting/'+player.id);
  waitRef.onDisconnect().remove();

  //check waiting room for players with 0 value
  enterWaitList();

  //listener for room_id changes for self-id in waiting room
  db.ref('waiting/'+player.id).on('value', function(snapshot) {

      //get opponents id, add yourself to the room
      console.log("my waiting status changed : " + snapshot.val());

      if(snapshot.val()){

        // var player_obj = {};
        // player_obj[player.id] = player;
        room_id = snapshot.val();

        // db.ref(room_id+'/players').update(player_obj);
        db.ref(room_id+'/players/'+player.id).set(player);

        var query = db.ref(room_id+'/players');
        query.on("value", function(parSnapshot) {
          if(parSnapshot.exists() && parSnapshot.val()){
            parSnapshot.forEach(function(chSnapshot) {
              console.log("=players snap: "+chSnapshot.key);
              var id = chSnapshot.key;
              if( id != player.id ){
                opponent = chSnapshot.val();
                console.log("=players: opponent found "+chSnapshot.val());
                
                drawMyChoiceButtons();

                //if player disconncted
                var playerRef = db.ref(room_id+'/players/'+player.id);
                playerRef.onDisconnect().remove();

                //if opponent disconnected
                processOpponentDisconnect();
                
                query.off();
                return false;//stop looping
              }
              if(opponent.id) return false;
            });
          }
        });
      }
  }, 
    function(error){
      console.log(error.code);
  });

});


// ============ chat ==============
$("#btn-send").on("click", function(){
  //send chat 
});
