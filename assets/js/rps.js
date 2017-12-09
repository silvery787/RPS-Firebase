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
  choice : 0,
  status : "online"
}

var opponent = {
  id : 0, 
  name : "",
  wins : 0,
  looses : 0,
  choice : 0,
  status : null
};

//=================================== 
function clearButtons(){
  $("#player1").empty();
  $("#player2").empty();
  $("#game-result").empty(); 
  
  $("#p2name").text("disconnected");
  $("#p2score").text();
}

function drawMyChoiceButtons(){
  
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

  db.ref('waiting').once('value', function(snapshot) {
    var roomW = snapshot.val();
    console.log(roomW);
    //if doesn't exist
    if( !roomW ){
      console.log("whaiting room: null");
      var tmp_p = {};
      tmp_p[player.id] = 0;
      db.ref('waiting').set(tmp_p);
    }
    else {
      //waiting room exists
      for( var pl_id in roomW ){
        console.log(pl_id, player.id);
        if(pl_id != player.id && roomW[pl_id]==0 ){
          //other waiting player found -> generate room_id
          opponent.id = pl_id;
          room_id = "room_"+Math.ceil(Math.random()*10000);
          break;
        }
      }
      console.log(room_id);
      if(room_id!=0){// if opponent was found
        //create new room
        var tmp_r = {};
        tmp_r[room_id] = {
          players : 0,
          chat : ""
        };
        db.ref().update(tmp_r);

        //add room_id to opponent's id
        db.ref('waiting/' + opponent.id).set(room_id);

        //add yourself to waiting with the same room_id
        var tmp_p = {};
        tmp_p[player.id] = room_id;
        db.ref('waiting').update(tmp_p);

        //add yourself to the new room
        tmp_p = {};
        tmp_p[player.id] = player;
        db.ref(room_id+'/players').update(tmp_p);

      }
      else{
        //opponent.id is undefined yet
        //add yourself to waiting room with room value == 0
        var tmp_p = {};
        tmp_p[player.id] = 0;
        //db.ref('waiting').update(tmp_p);
        db.ref('waiting').update(tmp_p);

      }
      
    }
  },
  function(error){
    console.log("error: "+error.code);
  });
}
//=========================

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

      console.log("p2-choice: "+ opponent.choice);
      //if( player.choice ){
      var p2text = getTextForChoice( opponent.choice );
      //draw/show pic for opponent choice
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

      //set self coice to 0 in db
      db.ref(room_id+'/players/'+player.id+'/choice').set(0);
      db.ref(room_id+'/players/'+player.id+'/wins').set(player.wins);
      db.ref(room_id+'/players/'+player.id+'/looses').set(player.looses);

      setTimeout( drawMyChoiceButtons , SCORE_TIMEOUT );
      
    }
  }, 
    function(error){
      console.log(error.code);
  });

});//choice click


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
      console.log("waiting list changed : "+snapshot.val());

      if(snapshot.val()){

        var player_obj = {};
        player_obj[player.id] = player;
        room_id = snapshot.val();
        db.ref(room_id+'/players').update(player_obj);

        db.ref(room_id+'/players').on('value', function(snap){
          console.log("getting players : "+snap.val());
          if(snap.val()){
            for(var p_id in snap.val()){
              if(p_id != player.id ){
                opponent = snap.val()[p_id];
                break;
                //todo: stop listening?
              }
            }
            drawPlayersInfo();

            //if player disconncted
            var playerRef = db.ref(room_id+'/players/'+player.id);
            playerRef.onDisconnect().remove();

            //if opponent disconnected
            db.ref(room_id+'/players/'+opponent.id).on('child_removed', function(event){
                  db.ref(room_id).remove();
                  player.choice = 0;
                  opponent = {};
                  room_id = 0;
                  clearButtons();
                  //todo : check for other 0s in wroom
                  //enterWaitList();
                  db.ref('waiting/'+player.id).set(0);

            });
          }
        });

        drawMyChoiceButtons();
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
