
function eVisitSessionController()
{

// bind event listeners to button clicks //
	var that = this;

//handle user home button click
	$('#btn-home').click(function(){ 
		window.location.href = '/home';		
	});


// handle user logout //
	$('#btn-logout-user').click(function(){ that.attemptLogout(); });

	var localStream, localPeerConnection, remotePeerConnection;

	var localVideo = $('#localVideo');
	var remoteVideo = $('#remoteVideo');

	var startButton = $('#startButton');
	var callButton = $('#callButton');
	var hangupButton = $('#hangupButton');
	startButton.disabled = false;
	callButton.disabled = true;
	hangupButton.disabled = true;

	$('#startButton').click(function(){
		that.start();
	});

	$('#callButton').click(function(){
		that.call();
	});

	startButton.onclick = start;
	callButton.onclick = call;
	hangupButton.onclick = hangup;

	function trace(text) {
	  console.log((performance.now() / 1000).toFixed(3) + ": " + text);
	}

	function gotStream(stream){
	  trace("Received local stream");
	  localVideo.src = URL.createObjectURL(stream);
	  localStream = stream;
	  callButton.disabled = false;
	}

	function start() {
	  trace("Requesting local stream");
	  startButton.disabled = true;
	  getUserMedia({audio:true, video:true}, gotStream,
	    function(error) {
	      trace("getUserMedia error: ", error);
	    });
	}

	function call() {
	  callButton.disabled = true;
	  hangupButton.disabled = false;
	  trace("Starting call");

	  if (localStream.getVideoTracks().length > 0) {
	    trace('Using video device: ' + localStream.getVideoTracks()[0].label);
	  }
	  if (localStream.getAudioTracks().length > 0) {
	    trace('Using audio device: ' + localStream.getAudioTracks()[0].label);
	  }

	  var servers = null;

	  localPeerConnection = new RTCPeerConnection(servers);
	  trace("Created local peer connection object localPeerConnection");
	  localPeerConnection.onicecandidate = gotLocalIceCandidate;

	  remotePeerConnection = new RTCPeerConnection(servers);
	  trace("Created remote peer connection object remotePeerConnection");
	  remotePeerConnection.onicecandidate = gotRemoteIceCandidate;
	  remotePeerConnection.onaddstream = gotRemoteStream;

	  localPeerConnection.addStream(localStream);
	  trace("Added localStream to localPeerConnection");
	  localPeerConnection.createOffer(gotLocalDescription,handleError);
	}

	function gotLocalDescription(description){
	  localPeerConnection.setLocalDescription(description);
	  trace("Offer from localPeerConnection: \n" + description.sdp);
	  remotePeerConnection.setRemoteDescription(description);
	  remotePeerConnection.createAnswer(gotRemoteDescription,handleError);
	}

	function gotRemoteDescription(description){
	  remotePeerConnection.setLocalDescription(description);
	  trace("Answer from remotePeerConnection: \n" + description.sdp);
	  localPeerConnection.setRemoteDescription(description);
	}

	function hangup() {
	  trace("Ending call");
	  localPeerConnection.close();
	  remotePeerConnection.close();
	  localPeerConnection = null;
	  remotePeerConnection = null;
	  hangupButton.disabled = true;
	  callButton.disabled = false;
	}

	function gotRemoteStream(event){
	  remoteVideo.src = URL.createObjectURL(event.stream);
	  trace("Received remote stream");
	}

	function gotLocalIceCandidate(event){
	  if (event.candidate) {
	    remotePeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
	    trace("Local ICE candidate: \n" + event.candidate.candidate);
	  }
	}

	function gotRemoteIceCandidate(event){
	  if (event.candidate) {
	    localPeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
	    trace("Remote ICE candidate: \n " + event.candidate.candidate);
	  }
	}

	function handleError(){}



	this.attemptLogout = function()
	{
		var that = this;
		$.ajax({
			url: "/home",
			type: "POST",
			data: {logout : true},
			success: function(data){
	 			that.showLockedAlert('You are now logged out.<br>Redirecting you back to the homepage.');
			},
			error: function(jqXHR){
				console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
			}
		});
	}

	this.showLockedAlert = function(msg){
		$('.modal-alert').modal({ show : false, keyboard : false, backdrop : 'static' });
		$('.modal-alert .modal-header h3').text('Success!');
		$('.modal-alert .modal-body p').html(msg);
		$('.modal-alert').modal('show');
		$('.modal-alert button').click(function(){window.location.href = '/';})
		setTimeout(function(){window.location.href = '/';}, 3000);
	}
}

