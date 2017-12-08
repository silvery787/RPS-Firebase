  
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

// var opponent_id = 0;
// var opponent_choice = 0;

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

//var player_turn = 0;
var game_started = false;
var game_wait_time_start = null;

//=================================== 

function drawMyChoiceButtons(){

  $("#player1").empty();
  $("#player2").empty();
  $("#game-result").empty();
  // var myName = $("<span>");
  // myName.text(player.name);
  // $("#player1").append(myName);

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

function drawBoxes(){

}

function getTextForChoice( choice ){
  switch(choice){
    case 'r' : return "=Rock=";
    case 'p' : return "=Paper=";
    case 's' : return "=Scissors=";
  }
}

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
  //db.ref(room_id+'/players/'+opponent.id).on('value', function(snapshot){
    console.log("opponent : "+opponent.id);
    opponent.choice = snapshot.val();
    console.log("opponents choice: "+ opponent.choice);

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
          console.log("WIN");
      }
      else{
        $("#game-result").text("You Loose!");
        player.looses++;
        opponent.wins++;

        console.log("LOOSE");
      } 

      opponent.choice = 0;
      player.choice = 0;

      //set self coice to 0 in db
      db.ref(room_id+'/players/'+player.id+'/choice').set(0);
      db.ref(room_id+'/players/'+player.id+'/wins').set(player.wins);
      db.ref(room_id+'/players/'+player.id+'/looses').set(player.looses);

      //redraw buttons in 5 sec?
      setTimeout( drawMyChoiceButtons , 10000 );
      
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
          opponent.id = pl_id;
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

  //listener for room_id changes for self-id in waiting room
  db.ref('waiting/'+player.id).on('value', function(snapshot) {

      //get opponents id, add yourself to the room
      console.log("waiting list changed : "+snapshot.val());

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
                opponent.id = p_id;
                opponent.choice = snap.val()[p_id].choice;
                break;
              }
            }
            console.log("opponent: "+ opponent.id);
            console.log("opponent choice: "+ opponent.choice);
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