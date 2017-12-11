const SCORE_TIMEOUT = 5000;// time for showing result
const MAX_TIMER = 30; // time for choosing option
const MAX_MSG_IN_CHAT = 7; //max messages to show in chat window

var rps_images = {
  r : 'assets/images/earth.jpg', // rock=earth
  p : 'assets/images/fire.jpg', //paper=fire
  s : 'assets/images/water.jpg', //scissors=water
  t : 'assets/images/question1.png' // out of time
};

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

var chat = [];

var intervalId;
var clockRunning = false;
var game_timer = {
  time: MAX_TIMER,

  start: function() {
    game_timer.time = MAX_TIMER;
    if (!clockRunning) {
        intervalId = setInterval(game_timer.count, 1000);
        clockRunning = true;
    }
  },

  stop: function() {
    clearInterval(intervalId);
    clockRunning = false;
  },

  count: function() {

    $("#game-result").text(game_timer.time);

    if(game_timer.time == 0){

      game_timer.stop();
      proccessNotInTime(); 
    }
    else{
        game_timer.time--;
    }
  }
 };

function proccessNotInTime(){

  player.choice = "t";

  $("#player1").empty();
  var p1text = getTextForChoice( player.choice );
  $("#player1").html(p1text);

  db.ref(room_id+'/players/'+player.id).update({ choice: player.choice });

  var choiceRef = db.ref(room_id+'/players/'+opponent.id+'/choice');
  choiceRef.on('value', function(snapshot){

    opponent.choice = snapshot.val();
    if( opponent.choice && player.choice ){
      var p2text = getTextForChoice( opponent.choice );
      $("#player2").html(p2text);

      $("#game-result").html("You Loose!");
      player.looses++; 

      opponent.choice = 0;
      player.choice = 0;

      db.ref(room_id+'/players/'+player.id).set(player);

      setTimeout( drawChoiceButtons , SCORE_TIMEOUT );
      
      choiceRef.off();
    }
  });

}
//=================================== 

function clearButtons(){
  
  game_timer.stop();

  $("#player1").empty();
  $("#player2").empty();
  $("#game-result").empty(); 
  
  $("#p2name").text('disconnected');
  $("#p2score").empty();

}

function drawChoiceButtons(){
  
  if(player.id && opponent.id){
    drawPlayersInfo();

    $("#player1").empty();
    $("#player2").empty();
    $("#game-result").empty();

    //draw r p s
    var rock_btn = $("<img>");
    // var rock_btn = $("<button>");
    rock_btn.addClass("choice_btn");
    rock_btn.attr("data", "r");
    // rock_btn.text("=Rock=");
    rock_btn.attr("src", rps_images.r);
    rock_btn.attr("alt","Earth (rock)");
    $("#player1").append(rock_btn);

    var paper_btn = $("<img>");
    // var paper_btn = $("<button>");
    paper_btn.addClass("choice_btn");
    paper_btn.attr("data", "p");
    // paper_btn.text("=Paper=");
    paper_btn.attr("src", rps_images.p);
    paper_btn.attr("alt","Fire (paper)");    
    $("#player1").append(paper_btn);

    var scissors_btn = $("<img>");
    // var scissors_btn = $("<button>");
    scissors_btn.addClass("choice_btn");
    scissors_btn.attr("data", "s");
    // scissors_btn.text("=Scissors=");
    scissors_btn.attr("src", rps_images.s);
    scissors_btn.attr("alt","Water (scissors)");
    $("#player1").append(scissors_btn);

    game_timer.start();

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
    case 'r' : return "<img src='" + rps_images.r +"' alt='Earth (rock)'>";
    case 'p' : return "<img src='" + rps_images.p +"' alt='Fire (paper)'>";
    case 's' : return "<img src='" + rps_images.s +"' alt='Water (scissors)'>";
    // case 't' : return "<img src='" + rps_images.t +"' alt='Out of Time'>";
    case 't' : return "<p class='box-text'>Out of Time</p>";
  }

}
// =============================

function enterWaitList(){

//  db.ref('waiting').once('value', function(snapshot) {
  var query = db.ref('waiting').orderByKey();
  query.once('value').then( function(snapshot) {
    //if waiting doesn't exist
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

      //console.log("Room = "+room_id);

      if( room_id != 0 ){// if opponent was found
        //create new room
        db.ref(room_id).set({
          players: 0,
          chat : ""
        });

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
    
    chat.push({
      id : opponent.id,
      name: opponent.name,
      msg: 'disconnected'  
    });
    renderChat();
    $("#btn-send").prop("disabled",true);

    db.ref(room_id).remove();
    player.choice = 0;
    opponent = {};
    room_id = 0;
    
    clearButtons();

    enterWaitList();

  });
}
//=========== CHOICE CLICK ==============

$("#player1").on("click", ".choice_btn", function(){

  game_timer.stop();

  player.choice = $(this).attr("data");

  //draw/show a picture of choice 
  $("#player1").empty();
  var p1text = getTextForChoice( player.choice );
  // $("#player1").text(p1text);
  $("#player1").html(p1text);
  //save choice to db
  db.ref(room_id+'/players/'+player.id).update({ choice: player.choice });

  opponent.choice = 0;

  var choiceRef = db.ref(room_id+'/players/'+opponent.id+'/choice');
  choiceRef.on('value', function(snapshot){

    opponent.choice = snapshot.val();

    if( opponent.choice && player.choice ){

      var p2text = getTextForChoice( opponent.choice );
      // $("#player2").text(p2text);
      $("#player2").html(p2text);

      //check who is the winner
      if( opponent.choice == "t" && player.choice!= "t" ){//opponent didn't answer in time
        $("#game-result").text("You Win!");
          player.wins++;
          opponent.looses++;
      }
      else if ( player.choice == opponent.choice ) {
      // else if (player.choice == opponent.choice && player.choice != "t") {
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

      setTimeout( drawChoiceButtons , SCORE_TIMEOUT );
      
      choiceRef.off();
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
  $("#greeting").text("Hello "+player.name);

  $("#p1name").text(player.name);
  $("#p1score").text("wins: "+player.wins+" | looses: "+player.looses);

  var waitRef = firebase.database().ref('waiting/'+player.id);
  waitRef.onDisconnect().remove();

  //check waiting room for players with 0 value
  enterWaitList();

  //listener for room_id changes for self-id in waiting room
  db.ref('waiting/'+player.id).on('value', function(snapshot) {

      //get opponents id, add yourself to the room
      //console.log("my waiting status changed : " + snapshot.val());

      if(snapshot.val()){

        room_id = snapshot.val();

        db.ref(room_id+'/players/'+player.id).set(player);

        var query = db.ref(room_id+'/players');
        query.on("value", function(parSnapshot) {
          if(parSnapshot.exists() && parSnapshot.val()){
            parSnapshot.forEach(function(chSnapshot) {
              //console.log("=players snap: "+chSnapshot.key);
              var id = chSnapshot.key;
              if( id != player.id ){
                opponent = chSnapshot.val();
                //console.log("=players: opponent found "+chSnapshot.val());
                
                drawChoiceButtons();

                $("#btn-send").prop("disabled",false);
                $("#msg-text").prop("disabled",false);

                // add chat listener
                db.ref(room_id+'/chat').limitToLast(1).on("child_added", function(snap){
                  var plMsg = {
                    id : snap.val().id,
                    name : snap.val().name,
                    msg : snap.val().msg
                  };
                  chat.push(plMsg);
                  renderChat();
                });

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


// ============ CHAT ==============

function renderChat(){

  $("#chat-history").empty();

  var class_name = ""
  var msg_counter = 1;
  for(var i = chat.length-1; i >= 0; i--){
    
    if( msg_counter > MAX_MSG_IN_CHAT) break;
    msg_counter++;

    if( chat[i].id == player.id ) 
      class_name = "chat_player";
    else
      class_name = "chat_opponent";

    var msg_div = $("<div>");
    var name_span = $("<span>").attr("class", class_name);
    var msg_html = "";

    if(chat[i].msg == "disconnected"){
      name_span.text( chat[i].name + " => ");
    }
    else{
      name_span.text("["+chat[i].name+"]: ");
    }
    msg_div.html(chat[i].msg+"<br>");
    msg_div.prepend(name_span);

    $("#chat-history").prepend(msg_div);
  }

}

$("#btn-send").on("click", function(){
  event.preventDefault();

  var message = $("#msg-text").val();
  $("#msg-text").val("");
  if( room_id && message != "" ){
    db.ref(room_id+'/chat').push({
      id : player.id,
      name : player.name,
      msg : message
    });
  }  

});

$(document).ready(function(){
  $("#btn-send").prop("disabled",true);
  $("#msg-text").prop("disabled",true);
});
