  
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

var opponent_id = 0;
var opponent_choice = 0;

var player = {
  id : 0, 
  name : "",
  wins : 0,
  looses : 0,
  choice : 0
}
//var player_turn = 0;
var game_started = false;
var game_wait_time_start = null;

//=================================== 

function drawMyChoiceButtons(){
  var myName = $("<span>");
  myName.text(player.name);
  $("#player1").append(myName);
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

function getTextForChoice( choice ){
  switch(choice){
    case 'r' : return "=Rock=";
    case 'p' : return "=Paper=";
    case 's' : return "=Scissors=";
  }
}

$("#player1").on("click", ".choice_btn", function(){

  var p1c = $(this).attr("data");
  var p2c = 0;
  console.log("p1-choice: "+p1c);
  //draw/show a picture of chice 
  $("#player1").empty();
  var p1text = getTextForChoice( p1c );
  //draw/show pic for opponent choice
  $("#player1").text(p1text);

  //save choice to db
  db.ref(room_id+'/players/'+player.id).update({ choice: p1c });

//  db.ref(room_id+'/players/'+opponent_id+'/choice').on('value', function(snapshot){
  db.ref(room_id+'/players/'+opponent_id).on('value', function(snapshot){
    console.log("opponent : "+opponent_id);
    var p2 = snapshot.val();
    console.log("opponents choice changed: "+ p2);
    if( p2 ){
      p2c = p2.choice;
      console.log("p2-choice: "+p2c);
      if(p2c){
        opponent_choice = p2c;
        // console.log("p2-choice: "+p2c);
        var p2text = getTextForChoice( p2c )
        //draw/show pic for opponent choice
        $("#player2").text(p2text);

        //check who is the winner + timeout 5 sec?
        if (p1c == p2c) {
          $("#game-result").text("Ties!");
        }
        else if( (p1c == "r" && p2c == "s") ||
            (p1c == "p" && p2c == "r") ||
            (p1c == "s" && p2c == "p")){
            $("#game-result").text("You Win!");
            console.log("WIN");
        }
        else{
          $("#game-result").text("You Loose!");
          console.log("LOOSE");
        } 

        opponent_choice = 0;
        player.choice = 0;
        //set self coice to 0 in db
        //increments wins or looses in obj and db
      }
    }
  }, 
    function(error){
      console.log(error.code);
  });

});


$("#btn-start").on("click", function(){
  event.preventDefault();
  
  player.name = $("#player-name").val().trim();

  var rnd = Math.ceil(Math.random()*10000);
  player.id = "" + player.name + rnd;

  game_started = 1;

  $("#start-form").hide();

  //to do: draw greetings, name, game status etc.

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
          //generate room_id
          opponent_id = pl_id;
          room_id = "room_"+Math.ceil(Math.random()*10000);
          break;
        }
      }
      console.log(room_id);
      if(room_id!=0){// if opponent found
        console.log("111111");
        //create new room
        var tmp_r = {};
        tmp_r[room_id] = {
          players : 0,
          chat : ""
        };
        db.ref().update(tmp_r);

        //add room_id to opponent's id
        db.ref('waiting/' + opponent_id).set(room_id);

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
        //opponent_id undefined in this case yet
        //add yourself to waiting room with room value == 0
        var tmp_p = {};
        tmp_p[player.id] = 0;
        db.ref('waiting').update(tmp_p);

      }
      
    }
  },
  function(error){
    console.log("error: "+error.code);
  });

  console.log("0000000");

  //listener for room_id changes for self-id in waiting room
  db.ref('waiting/'+player.id).on('value', function(snapshot) {

      //get opponents id, add yourself to the room
      console.log("my status in waiting list changed : "+snapshot.val());

      if(snapshot.val()){

        var tmp_p = {};
        tmp_p[player.id] = player;
        room_id = snapshot.val();
        db.ref(room_id+'/players').update(tmp_p);

        db.ref(room_id+'/players').on('value', function(snap){
          console.log("getting players : "+snap.val());
          if(snap.val()){
            for(var p_id in snap.val()){
              if(p_id != player.id ){
                opponent_id = p_id;
                opponent_choice = snap.val()[p_id].coice;
                break;
              }
            }
            console.log("opponent: "+ opponent_id);
            console.log("opponent coice: "+ opponent_choice);
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
//code examples

 //    database.ref().set({
 //      highBidder: bidderName,
 //      highPrice: bidderPrice
 //    });

 // if (snapshot.child("highBidder").exists() && snapshot.child("highPrice").exists()) {
 //  snapshot.val() -> jObj