'use strict';

/*global $:false */
/*global Modules:false */
/*global emotify:false */
/*global io:false */
/*global TB:false */

Modules.controllers.controller('ChatController', ['$rootScope', '$scope', '$http', '$location', '$filter', 'Session', 'User', 'Mails' , 'ChatUser',
	function($rootScope, $scope, $http, $location, $filter, Session, User, Mails, ChatUser) {
		document.title = "Talkus";
		//calendar
		$scope.today = function() {
			$scope.dt = new Date();
		};
		$scope.today();

		$scope.showWeeks = true;
		$scope.toggleWeeks = function () {
			$scope.showWeeks = ! $scope.showWeeks;
		};

		$scope.toggleMin = function() {
			$scope.minDate = ( $scope.minDate ) ? null : new Date();
		};
		$scope.toggleMin();

		$scope.open = function($event) {
			$event.preventDefault();
			$event.stopPropagation();

			$scope.opened = true;
		};

		$scope.format = 'dd/MM/yyyy';

		var hostURL = window.location.host.split(':')[0],
				portURL = window.location.host.split(':')[1],
				socket = io.connect(hostURL, {port: portURL}),
				RouletteApp;

		$scope.initchat = function(){

			$('html').addClass('chat');
			$('html').removeClass('video');

			function hideMyImageShowCamera(){
				$('#sidebar-wrapper-anonym div.profile div.inside form fieldset ul').hide();
				$('#menu-close-anonym').click();
				$('#sidebar-wrapper-anonym').css('width', '30.7%');
				$('#popoverInfoMe').hide();
			}

			function showMyImageHideCamera(){
				$('#sidebar-wrapper-anonym div.profile div.inside form fieldset ul').show();
				$('#menu-toggle-anonym').click();
				$('#sidebar-wrapper-anonym').css('width', '250px');
				$('#popoverInfoMe').show();
			}

			function hideAnonymImageShowCamera(){
				$('#anonym-profile').hide();
			}

			function showAnonymImageHideCamera(){
				$('#anonym-profile').show();
			}

			var SocketProxy = function() {

				var findTextVideoPartner = function(mySessionId) {
					socket.emit('nextTextVideo', { sessionId: mySessionId });
				};

				var findTextPartner = function() {
					socket.emit('nextText');
				};

				var disconnectTextPartners = function() {
					socket.emit('disconnectPartners', 'text');
				};

				return {
					findTextPartner: findTextPartner,
					disconnectTextPartners: disconnectTextPartners,
					findTextVideoPartner: findTextVideoPartner
				};
			}();

			RouletteApp = function() {

				var apiKey = 44738532;
				var mySession;
				var partnerSession;
				var subscriberObject;
				var publisherObject;

				var ele = {};
				TB.setLogLevel(TB.DEBUG);

				var init = function(sessionId, token, times) {

					function sessionConnectedHandler() {

						hideMyImageShowCamera();

						var div = document.createElement('div');
						div.setAttribute('id', 'publisher');
						ele.publisherContainer.appendChild(div);

						publisherObject = TB.initPublisher(apiKey, div.id,{width:400, height:300});
						mySession.publish(publisherObject);
					}

					function streamCreatedHandler(event) {
						socket.emit('newVideoChat2');

						var stream = event.streams[0];

						if (times && times === 'second'){
							if (mySession.connection.connectionId === stream.connection.connectionId) {
								SocketProxy.findTextVideoPartner(mySession.sessionId);
							}
						}
					}

					function sessionDisconnectedHandler() {
						showMyImageHideCamera();
						mySession.removeEventListener('sessionConnected', sessionConnectedHandler);
						mySession.removeEventListener('streamCreated', streamCreatedHandler);
						mySession.removeEventListener('sessionDisconnected', sessionDisconnectedHandler);
					}

					ele.publisherContainer = document.getElementById('publisherContainer');
					ele.subscriberContainer = document.getElementById('subscriberContainer');
					ele.nextButton = document.getElementById('nextButton');


					ele.nextButton.onclick = function() {
						socket.emit('cancelPusblish');
						RouletteApp.nextText();
					};

					mySession = TB.initSession(sessionId);

					mySession.addEventListener('sessionConnected', sessionConnectedHandler);
					mySession.addEventListener('streamCreated', streamCreatedHandler);
					mySession.addEventListener('sessionDisconnected', sessionDisconnectedHandler);

					if (!mySession.connected){
						mySession.connect(apiKey, token);
					}
				};

				var nextText = function() {
					SocketProxy.disconnectTextPartners();
					SocketProxy.findTextPartner();
				};

				var initText = function() {
					ele.nextButton = document.getElementById('nextButton');

					ele.nextButton.onclick = function() {
						RouletteApp.nextText();
					};

					SocketProxy.findTextPartner();
				};

				var disconnectPartner = function() {
					partnerSession.disconnect();
				};

				var unsuscribePartner = function() {
					showAnonymImageHideCamera();
					partnerSession.unsubscribe(subscriberObject);
				};

				var unpublishSession = function(){
					mySession.disconnect();
				};

				var subscribe = function(sessionId, token) {

					function sessionConnectedHandler(event) {

						hideAnonymImageShowCamera();

						var div = document.createElement('div');
						div.setAttribute('id', 'subscriber');
						ele.subscriberContainer.appendChild(div);

						subscriberObject = partnerSession.subscribe(event.streams[0], div.id, {width:400, height:300});
					}

					function sessionDisconnectedHandler() {
						partnerSession.removeEventListener('sessionConnected', sessionConnectedHandler);
						partnerSession.removeEventListener('sessionDisconnected', sessionDisconnectedHandler);
						partnerSession.removeEventListener('streamDestroyed', streamDestroyedHandler);
					}

					function streamDestroyedHandler() {
						partnerSession.disconnect();
					}

					partnerSession = TB.initSession(sessionId);

					partnerSession.addEventListener('sessionConnected', sessionConnectedHandler);
					partnerSession.addEventListener('sessionDisconnected', sessionDisconnectedHandler);
					partnerSession.addEventListener('streamDestroyed', streamDestroyedHandler);

					if(!partnerSession.connected){
						partnerSession.connect(apiKey, token);
					}



				};

				var wait = function() {
					//Wait for person
				};

				return {
					init: init,
					initText: initText,
					nextText: nextText,
					subscribe: subscribe,
					disconnectPartner: disconnectPartner,
					unsuscribePartner: unsuscribePartner,
					unpublishSession: unpublishSession,
					wait: wait
				};

			}();

			socket.on('connect', function(){
				socket.emit('adduser', 'Anonym', 'text');
			});

			socket.on('initialChatVideoInTextRoom', function(data, times) {
				RouletteApp.init(data.sessionId, data.token, times);
			});

			socket.on('initialText', function() {
				RouletteApp.initText();
			});

			socket.on('subscribe', function(data) {
				RouletteApp.subscribe(data.sessionId, data.token);
			});

			socket.on('disconnectPartner', function() {
				RouletteApp.unsuscribePartner();
			});

			socket.on('cancelPublishingStream', function(){
				RouletteApp.unpublishSession();
			});

			socket.on('empty', function() {
				//nobody to chat
			});

			socket.on('showWriting', function(){
				if ($('#userTyping').css('display') === 'none'){
					$('#userTyping').show();
					document.title = 'User Typing..';
					$(window).focus(function() {
						document.title = 'Talkus';
					});
				}
			});

			socket.on('hideWriting', function(){
				if ($('#userTyping').css('display') === 'block'){
					$('#userTyping').hide();
					document.title = 'New Message';
					$(window).focus(function() {
						document.title = 'Talkus';
					});
				}
			});

			socket.on('updatechat', function (username, data, type, user, file , sound, video) {
				if (type !== undefined){
					var videoExist = false;
					var countPlayer;
					var videoId;
					switch(type){
						case 'leave':
							//Disconect
							$('#data').attr('disabled', true);
							$('#datasend').attr('disabled', true);

							$scope.validations.anonymOtherUserValidationFields.Email = true;
							$scope.validations.anonymOtherUserValidationFields.Name = true;
							$scope.validations.anonymOtherUserValidationFields.Gender = true;
							$scope.validations.anonymOtherUserValidationFields.Description = true;
							$scope.validations.anonymOtherUserValidationFields.Location = true;
							$scope.validations.anonymOtherUserValidationFields.Birth = true;

							if ($scope.otherUserInfo !== undefined){
								$scope.otherUserInfo.username = '';
							}

							$('.fieldsetProfile').hide();

							$('#conversation').append('<div class=\'clear\'></div><div class=\'serverchat\'><i class=\'icon-user\'></i><div><span class=\'muted\'>Me dejaron!</span></div><div class=\'clear\'></div>');

							//executeAnimateLoading();
							break;

						case 'connect':
							$('#conversation').empty();
							$('#conversation').append('<div class=\'serverchat\'><i class=\'icon-user\'></i>' + data + '</div><div class=\'clear\'></div>');
							break;

						case 'showMessageVideoMe':
							$('#extra-buttons #newVideoChat').remove();
							$('#extra-buttons').append('<input type="button" id="exitVideoChat" class="btn btn-primary log" value="Cancel video chat">');
							$('#conversation').append('<div class=\'clear\'></div><div class=\'serverchat\'><i class=\'icon-user\'></i><div><span class=\'muted\'>you want to star a videochat</span></div><div class=\'clear\'></div>');
							break;

						case 'showMessageVideoAnonym':
							$('#conversation').append('<div class=\'clear\'></div><div class=\'startChatNow serverchat\'><i class=\'icon-user\'></i><div><span class=\'muted\'>user wants to do video chat</span><input class=\'btn btn-primary log\' type=\'button\' value=\'Accept\' id=\'startVideoChat\' /><input class=\'btn btn-primary log\' type=\'button\' value=\'Cancel\' id=\'cancelVideoChat\' /></div></div><div class=\'clear\'></div>');
							break;

						case 'succesMessageVideoMe':
							$('#conversation .startChatNow').remove();
							$('#conversation').append('<div class=\'clear\'></div><div class=\'serverchat\'><i class=\'icon-user\'></i><div><span class=\'muted\'>you both are now on Video<span></div><div class=\'clear\'></div>');
							break;

						case 'succesMessageVideoAnonym':
							$('#conversation .startChatNow').remove();
							$('#conversation').append('<div class=\'clear\'></div><div class=\'serverchat\'><i class=\'icon-user\'></i><div><span class=\'muted\'>you both are now on Video</span></div><div class=\'clear\'></div>');
							break;

						case 'failMessageVideoMe':
							$('#conversation').append('<div class=\'clear\'></div><div class=\'serverchat\'><i class=\'icon-user\'></i><div><span class=\'muted\'>Sorry :(</span></div><div class=\'clear\'></div>');
							break;

						case 'failMessageVideoAnonym':
							$('#conversation').append('<div class=\'clear\'></div><div class=\'serverchat\'><i class=\'icon-user\'></i><div><span class=\'muted\'>Perv!</span></div><div class=\'clear\'></div>');
							break;

						case 'cancelMessageVideoMe':
							$('#extra-buttons #exitVideoChat').remove();
							$('#extra-buttons').append('<input type="button" id="newVideoChat" class="btn btn-primary log" value="video chat">');
							$('#conversation').append('<div class=\'clear\'></div><div class=\'serverchat\'><i class=\'icon-user\'></i><div><span class=\'muted\'>Sorry :(</span></div><div class=\'clear\'></div>');
							break;

						case 'cancelMessageVideoAnonym':
							$('#extra-buttons #exitVideoChat').remove();
							$('#extra-buttons').append('<input type="button" id="newVideoChat" class="btn btn-primary log" value="video chat">');
							$('#conversation').append('<div class=\'clear\'></div><div class=\'serverchat\'><i class=\'icon-user\'></i><div><span class=\'muted\'>Perv!</span></div><div class=\'clear\'></div>');
							break;

						case 'message':
							//to check if it has an image url
							var a = data,
									text = a.split(' '),
									filterTxt = [];
							for (var i=0; i<text.length; i++)
							{
								if(checkURL(text[i])){
									filterTxt.push('<a target="_blank" href="'+text[i]+'"><img src="'+text[i]+'" alt="img" class="in-image"></a>');
								}
								else{
									filterTxt.push(text[i]);
								}

								if (checkURLVideo(text[i])){
									countPlayer = $('.ytplayer').size() + "ytplayer";
									filterTxt.splice(i, 1);
									filterTxt.push('<div class="ytplayer" id=' + countPlayer + '></div>');
									videoExist = true;
									videoId = returnVideoId(text[i]);

									console.log('countPlayer: ' + countPlayer);
									console.log('filterTxt: ' + filterTxt);
								}
								else{
									//filterTxt.push(text[i]);
								}
							}
							data = filterTxt.join(" ");
							//end check
							if(user === 'me'){
								if(file){
									$('#conversation').append('<div class=\'me\'><i class=\'icon-user\'></i> <span class=\'text-info\'>'+username + ':</span> <a target="_blank" href="'+ data +'"><img src="' + data + '" alt="image" class="in-image" /></a></div>');
									if (videoExist){
										onYouTubePlayerAPIReady('390', '640', videoId, countPlayer);
									}
								}else{
									if(sound){
										$('#conversation').append('<div class=\'me\'><i class=\'icon-user\'></i> <span class=\'text-info\'>'+username + ':</span> <audio controls src="' + data + '" class="in-audio"></audio></div>');
										if (videoExist){
											onYouTubePlayerAPIReady('390', '640', videoId, countPlayer);
										}
									}
									else{
										$('#conversation').append('<div class=\'me\'><i class=\'icon-user\'></i> <span class=\'text-info\'>'+username + ':</span> ' + data + '</div>');
										if (videoExist){
											onYouTubePlayerAPIReady('390', '640', videoId, countPlayer);
										}

									}
								}

							}
							else{
								if(file){
									$('#conversation').append('<div class=\'anonym\'><i class=\'icon-user\'></i> <span class=\'text-info\'>'+username + ':</span> <a target="_blank" href="'+ data +'"><img src="' + data + '" alt="image" class="in-image" /></a></div>');
									if (videoExist){
										onYouTubePlayerAPIReady('390', '640', videoId, countPlayer);
									}
								}
								else{
									if(sound){
										$('#conversation').append('<div class=\'anonym\'><i class=\'icon-user\'></i> <span class=\'text-info\'>'+username + ':</span> <audio controls src="' + data + '" class="in-audio"></audio></div>');
										if (videoExist){
											onYouTubePlayerAPIReady('390', '640', videoId, countPlayer);
										}
									}
									else{
										$('#conversation').append('<div class=\'anonym\'><i class=\'icon-user\'></i> <span class=\'text-info\'>'+username + ':</span> ' + data + '</div>');
										if (videoExist){
											onYouTubePlayerAPIReady('390', '640', videoId, countPlayer);
										}
									}
								}

							}


							break;
					}
				}
			});

			//Anonym user catched
			socket.on('updateAnonymInfo', function () {
				$('#confirm').click();
				$('#data').attr('disabled', false);
				$('#datasend').attr('disabled', false);
				$('.fieldsetProfile').show();
				//stopAnimateLoading();
			});

			//Send text chat to room via click
			$('#datasend').on('click', function() {
				var cadenaAEliminar = /(<([^>]+)>)/gi,
						elementoEtiquetas = $('#data'),
						etiquetas = elementoEtiquetas.val(),
						mensaje;

				etiquetas = etiquetas.replace(cadenaAEliminar, '');
				elementoEtiquetas.val(etiquetas);
				mensaje = elementoEtiquetas.val();
				mensaje = emotify(mensaje);

				$('#data').val('');

				socket.emit('sendchat', mensaje);
			});

			//Send text chat to room via enter
			$('#data').keydown(function(e) {
				if(e.keyCode === 8 || e.keyCode === 46){
					if ($(this).val().length <= 1){
						socket.emit('userNotWriting');
					}
				}
				else{
					if (e.keyCode !== 13){
						socket.emit('userWriting');
					}
				}
			});

			$('#data').keypress(function(e) {
				if (e.keyCode === 13){
					if ($(this).val().length !== 0){
						$(this).blur();
						$('#datasend').focus().click();
						$('#data').focus();
					}
					socket.emit('userNotWriting');
				}
			});

			$('.glyphicon.glyphicon-camera.mycam').click(function(){
				if($('#data').attr('disabled') !== 'disabled'){
					$('#imagefile').click();
				}
			});
			$('#imagefile').bind('change', function(e){
				var data = e.originalEvent.target.files[0];
				var reader = new FileReader();
				reader.onload = function(evt){
					loadImage(
							evt.target.result,
							function (canvas) {
								canvas.toBlob(
										function (blob) {
											var readerFinal = new window.FileReader();
											readerFinal.readAsDataURL(blob);
											readerFinal.onload = function() {
												var base64data = readerFinal.result;
												socket.emit('user image', base64data);
											}
										},
										'image/jpeg'
								);
							},
							{
								maxWidth: 600,
								crop:true
							}
					);

				};
				reader.readAsDataURL(data);

			});

			$('#extra-buttons').on('click', '#newVideoChat', function(){
				socket.emit('newVideoChat');
			});

			$('#extra-buttons').on('click', '#exitVideoChat', function(){
				socket.emit('cancelVideoChat');
				setTimeout(function(){socket.emit('cancelPusblish');}, 300);
			});

			$('#conversation').on('click', '#startVideoChat',function(){
				socket.emit('succesNewVideoChat');
			});

			$('#conversation').on('click', '#cancelVideoChat',function(){
				socket.emit('failNewVideoChat');
			});


			//to check if it has an image url
			function checkURL(url) {
				if(url.match(/\.(jpeg|jpg|gif|png)$/) !== null){
					return url;
				}
				else{
					return false;
				}
			}

			function checkURLVideo(url){
				if (url.match(/www.youtube.com/) !== null){
					return url;
				}
				else{
					return false;
				}
			}

			function returnVideoId(url){
				var splitedUrl = url.split('v=');
				return splitedUrl[1];
			}

			var player;
			function onYouTubePlayerAPIReady(height, width, videoId, ytPlayerId) {
				player = new YT.Player(ytPlayerId, {
					height: height,
					width: width,
					videoId: videoId
				});
			}
		};

		$scope.newpermit = {
			days: false ,
			email: false
		};

		$scope.validations = {
			anonymUserExist: true,
			anonymUser: true,
			anonymOtherUser: true,
			anonymOtherUserValidationFields: {
				Name: false,
				Birth: false,
				Email: false,
				Location: false,
				Gender: false,
				Description: false
			}
		};

		$scope.userInformation = new User();
		$scope.otherUserInfo = new User();

		var googleBool = false;

		//get user session
		$scope.loadInfo = function () {
			//Get the user info by the session
			Session.get(function(response) {
				if ((response !== null ? response._id : void 0) !== null) {
					if (response._id !== null && response._id !== undefined){
						$scope.logoutBtn = true;
						//User info and User birth in format (dd/MM/yyyy)
						$scope.userInformation = response;
						$scope.userInformation.birth = $filter('date')(new Date($scope.userInformation.birth), 'dd/MM/yyyy');
						console.log($scope.userInformation.birth);
						//Validations
						//-Not a anonym user, just a loged user.
						$scope.validations.anonymUser = false;

						//Calculate how many days left before profile delete
						if($scope.userInformation.confirmed !== 'true'){

							//Show days left in account
							$scope.newpermit.days = true;

							var createdDate = new Date($scope.userInformation.created), //Account created date
									realRest = Math.floor((new Date() - createdDate) / 86400000); //days diff between dates

							if(realRest >= 15){}else{
								//Show adv days left
								$scope.days = 15 - realRest;
							}
						}
						else{
							//It's a confirmed account, and dont need any action.
						}
					}
					else{
						$scope.validations.anonymUser = true;
					}

					if($scope.validations.anonymUser === true){
						//$('body').addClass('not-login');
					}else{
						//$('body').addClass('login');
					}

					$('body').addClass('login');

					$scope.validations.anonymUser = false;
				}

				//User validation
				if ($scope.userInformation.username === undefined || $scope.userInformation.username === ''){
					ChatUser.getUsername({username: 'get'},
							function(response) {
								$scope.userInformation.username = 'anonym' + response.count;
								$scope.userInformation.usernameToShow = 'Anonym';
							}, function() {
								//error
							});
				}

				if ($scope.userInformation.email === undefined || $scope.userInformation.email === ''){$scope.userInformation.email = '';}
				if ($scope.userInformation.name === undefined || $scope.userInformation.name === ''){$scope.userInformation.name = $scope.userInformation.username;}
				if ($scope.userInformation.gender === undefined || $scope.userInformation.gender === ''){$scope.userInformation.gender = '';}
				if ($scope.userInformation.avatar === undefined || $scope.userInformation.avatar === ''){$scope.userInformation.avatar = '/images/uploads/images/avatars/default.jpg';}
				if ($scope.userInformation.description === undefined || $scope.userInformation.description === ''){$scope.userInformation.description = '';}
				if ($scope.userInformation.location === undefined || $scope.userInformation.location === ''){$scope.userInformation.location = '';}
				if ($scope.userInformation.birth === undefined || $scope.userInformation.birth === ''){$scope.userInformation.birth = '';}

				/*console.log('entro');


				 console.log($scope.userInformation.username);
				 socket.emit('adduser', username, 'text');*/

			}, function() {
				//error
			});
		};

		//user delete account
		$scope.deleteAccount = function(){
			User.delete({username : $scope.userInformation._id},
					function(){
						//Exito
					},
					function(){
						//Error
					});
		};

		//email resend
		$scope.resend = function(){
			Mails.delete(function() {
						//exito
					},
					function () {
						//error
					});
			$scope.newpermit.email = true;
		};

		/*upload images*/
		$('#fileimg').change(function(){
			$('#imgbtn').click();
		});

		$scope.uploadClick = function(){
			$('#fileimg').click();
		};

		/*End images*/
		$scope.deletePhoto = function(){
			$scope.userInformation.avatar = '/images/uploads/images/avatars/default.jpg';
			updateUserAll();
		};

		//user image is shown
		$scope.uploadImage = function(content){
			if(content.path === undefined || content.path === ''){
			}else{
				//trim path, quite lo que no necesita, con tal que a la final el path queda /images/uploads/images/avatars[[image.jpg]]
				$scope.userInformation.avatar = content.path.substr(content.path.indexOf('/images/uploads/images/avatars/') + 1);

				//se debe hacer aqui el mismo update
				updateUserAll();
			}
		};

		//general update function
		$scope.updateUsers = function () {
			updateUserAll();
		};

		$scope.pullDown = function(){
			console.log('push down');
		};

		//When GPS is enable, it will get users location
		$scope.locationBool = function () {
			if(googleBool === false){
				googleBool = true;
				$scope.userInformation.location = document.getElementById('locationgeo').value;
			}else{
				$scope.userInformation.location = '';
				googleBool = false;
			}
		};

		//get other user info
		$scope.otherUser = function (){
			if($scope.userInformation.username !== undefined && $scope.userInformation.username !== ''){
				ChatUser.get({username: $scope.userInformation.username},
						function(response) {
							$scope.validations.anonymOtherUser = false;
							$scope.otherUserInfo = response;

							//Fields and Validation Fields
							if ($scope.otherUserInfo.email === undefined || $scope.otherUserInfo.email === ''){$scope.validations.anonymOtherUserValidationFields.Email = true;}
							if ($scope.otherUserInfo.name === undefined || $scope.otherUserInfo.name === ''){$scope.validations.anonymOtherUserValidationFields.Name = true;}
							if ($scope.otherUserInfo.gender === undefined || $scope.otherUserInfo.gender === ''){$scope.validations.anonymOtherUserValidationFields.Gender = true;}
							if ($scope.otherUserInfo.description === undefined || $scope.otherUserInfo.description === ''){$scope.validations.anonymOtherUserValidationFields.Description = true;}
							if ($scope.otherUserInfo.location === undefined || $scope.otherUserInfo.location === ''){$scope.validations.anonymOtherUserValidationFields.Location = true;}
							if ($scope.otherUserInfo.birth === undefined || $scope.otherUserInfo.birth === '' || $scope.otherUserInfo.birth === null){$scope.validations.anonymOtherUserValidationFields.Birth = true;}

						}, function(response) {
							switch (response.status) {
								case 404:
									$scope.otherUserInfo.avatar = '/images/uploads/images/avatars/default.jpg';
									$scope.otherUserInfo.username = 'Anonym';
								//$('body').addClass('other-anonym');
							}
						});
			}
		};


		//logout
		$scope.logout = function(){

			Session.delete(function() {
				$('.preview-loading').hide();
				$location.path('/');
			});
		};

		/*Javascript section*/

		//update user info
		$('.FocusAccion').focusout(function() {
			updateUserAll();
		});

		//Here is where the users update function is called when needed
		function updateUserAll(){
			User.update($scope.userInformation,
					function () {
						//succes
					}, function () {
						//error
					});
		}

		/*End javascript section*/
	}]);