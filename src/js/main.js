window.addEventListener("DOMContentLoaded", function(){
	
	var board=new TalePlay.Board(document.getElementById("board"));
	board.addController(new TalePlay.Controller.Keyboard());
	
	var player=new TalePlay.Layer.RPGPlayer({
		board:board,
		gameName:"Elandryl Tales",
		baseUrl:"resources/",
		imageBaseUrl:"resources/images/",
		mapBaseUrl:"resources/maps/",
	});
	
}, false);