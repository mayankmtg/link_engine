var linkTank = angular.module('linkTank', ['ngRoute', 'ngAnimate', 'firebase']);

linkTank.run(["$rootScope", "$location", function($rootScope, $location) {
	$rootScope.$on("$routeChangeError", function(event, next, previous, error) {
		// We can catch the error thrown when the $requireSignIn promise is rejected
		// and redirect the user back to the home page
		if (error === "AUTH_REQUIRED") {
			$location.path("/auth");
		}
	});
}]);


linkTank.config(['$routeProvider', function($routeProvider){

	$routeProvider
		.when('/home', {
			templateUrl: 'views/home.html',
			controller: 'linkTankHome',
		})
		.when('/auth', {
			templateUrl: 'views/auth.html',
			controller:'linkTankAuth',
			 resolve: {
				// controller will not be loaded until $waitForSignIn resolves
				// Auth refers to our $firebaseAuth wrapper in the factory below
				"currentAuth": ["Auth", function(Auth) {
					// $waitForSignIn returns a promise so the resolve waits for it to complete
					return Auth.$waitForSignIn();
				}]
			}
		})
		.when('/adminChat', {
			templateUrl: 'views/adminChat.html',
			controller: 'linkTankAdminChat',
			resolve: {
				// controller will not be loaded until $requireSignIn resolves
				// Auth refers to our $firebaseAuth wrapper in the factory below
				"currentAuth": ["Auth", function(Auth) {
					// $requireSignIn returns a promise so the resolve waits for it to complete
					// If the promise is rejected, it will throw a $routeChangeError (see above)
					return Auth.$requireSignIn();
				}]
			}
		})
		.when('/chat', {
			templateUrl: 'views/chat.html',
			controller: 'linkTankChat',
			resolve: {
				// controller will not be loaded until $requireSignIn resolves
				// Auth refers to our $firebaseAuth wrapper in the factory below
				"currentAuth": ["Auth", "$location", function(Auth, $location) {
					// $requireSignIn returns a promise so the resolve waits for it to complete
					// If the promise is rejected, it will throw a $routeChangeError (see above)
					var authObj=Auth.$getAuth();
					if(authObj.uid=="hJPwTYfxqcf7HFcRbUfzi0XmF6s2"){
						$location.path('/adminChat');
					}
					return Auth.$requireSignIn();
				}]
			}
		})
		.when('/about',{
			templateUrl: 'views/about.html',
		})
		.when('/contact',{
			templateUrl: 'views/contact.html',
			controller: 'linkTankContact',
		})
		.when('/profile',{
			templateUrl: 'views/profile.html',
			controller: 'linkTankProfile',
			 resolve: {
				// controller will not be loaded until $waitForSignIn resolves
				// Auth refers to our $firebaseAuth wrapper in the factory below
				"currentAuth": ["Auth", function(Auth) {
					// $waitForSignIn returns a promise so the resolve waits for it to complete
					return Auth.$waitForSignIn();
				}]
			}
		}).otherwise({
			redirectTo: '/home'
		})
}]);


linkTank.factory("Auth", ["$firebaseAuth",
	function($firebaseAuth) {
		return $firebaseAuth();
	}
]);

linkTank.controller('linkTankAuth', ['$scope','$location', "Auth", function($scope, $location,Auth){
	$scope.auth = Auth;

	$scope.auth.$onAuthStateChanged(function(firebaseUser) {
      		if (firebaseUser) {
	      		$scope.firebaseUser = firebaseUser;
	      		console.log($scope.firebaseUser);
		}
    	});
	$scope.linkTankStart=function(){
		$location.path('/chat');
	}
	$scope.linkTankSignup = function() {
		$location.path('/profile');
	};
	$scope.linkTankSignin=function(){
		$scope.error=null;
		Auth.$signInWithEmailAndPassword($scope.linkTankEmail, $scope.linkTankPassword)
			.catch(function(error) {
				$scope.error=error;
			});

	};
	$scope.linkTankSignout=function(){
		$scope.message = "SignOut Successful";
		$location.path('/home');
		console.log("SignOut");
	}

}]);

linkTank.controller('linkTankHome', ['$scope', '$location', function($scope, $location){

}]);

linkTank.controller('linkTankProfile', ['$scope','Auth','$firebaseArray','$location',function($scope, Auth,$firebaseArray,$location){
	$scope.auth = Auth;

	$scope.auth.$onAuthStateChanged(function(firebaseUser) {
      		if (firebaseUser) {
	      		$scope.firebaseUser = firebaseUser;
	      		$scope.linkTankDisp();
	      		console.log($scope.firebaseUser);
		}
    	});

	var ref=firebase.database().ref().child('Users');
	var ref2=firebase.database().ref().child('usernames');
	$scope.$watch("linkTankUname", function(){
		$scope.validUname=false;
		if($scope.linkTankUname!=null){
			var wUname=""+$scope.linkTankUname;
			ref2.child(wUname).once('value').then(function(snapshot){
				var corresUname= snapshot.val();
				console.log(corresUname);
				if(corresUname){
					$scope.$apply(function(){
						$scope.validUname=false;
					});
				}
				else{
					$scope.$apply(function(){
						$scope.validUname=true;
					});
				}
			});
		}

		console.log("Valid: "+ $scope.validUname);
	});
	$scope.linkTankDisp= function(){
		/* TODO: write this function for profile after login */
	}
	$scope.linkTankRegister = function(){
		$scope.message = null;
		$scope.error = null;
		// Create a new user
		if($scope.linkTankPassword === $scope.linkTankConfirm){
			Auth.$createUserWithEmailAndPassword($scope.linkTankEmail, $scope.linkTankPassword)
				.then(function(firebaseUser) {
					$scope.message = "Sign Up Successful!! You can now Sign In Easily";
					ref.child(Auth.$getAuth().uid).child("name").set($scope.linkTankName);
					ref.child(Auth.$getAuth().uid).child("uname").set($scope.linkTankUname);
					ref2.child($scope.linkTankUname).set(Auth.$getAuth().uid);
					$scope.flinkTankFriends = $firebaseArray(ref.child("hJPwTYfxqcf7HFcRbUfzi0XmF6s2").child('Friends'));
					$scope.flinkTankFriends.$add({
						fUid : Auth.$getAuth().uid,
						fUname: $scope.linkTankUname
					});
					$location.path('/auth');

				}).catch(function(error) {
					console.log(error);
					$scope.error = error;
				});	
		}
		else{
			$scope.error.code="Password Mismatch";
			$scope.error.message="Please re-enter Passwords in both fields";
			$scope.linkTankPassword="";
			$scope.linkTankConfirm="";
		}
	}
}]);

linkTank.controller('linkTankChat', ['$scope','Auth','$firebaseArray','$location', function($scope, Auth,$firebaseArray,$location){
	var refC=firebase.database().ref().child('Chatroom');
	var refU=firebase.database().ref().child('Users');
	$scope.messages=null;
	$scope.currentChatfUname="admin";
	$scope.currentChatfUid="hJPwTYfxqcf7HFcRbUfzi0XmF6s2";
	$scope.uname=null;
	$scope.messages=$firebaseArray(refC.child(Auth.$getAuth().uid).child($scope.currentChatfUid));
	
	refU.child(Auth.$getAuth().uid).child("uname").once("value")
	.then(function(snapshot){
		$scope.uname=snapshot.val();
	})
	.catch(function(error){
		console.log(error);
	});


	$scope.fUname = $scope.currentChatfUname;


	$scope.linkTankSend= function(){
		if($scope.currentChatfUname!=null){
			$scope.messages=$firebaseArray(refC.child(Auth.$getAuth().uid).child($scope.currentChatfUid));
			$scope.fmessages=$firebaseArray(refC.child($scope.currentChatfUid).child(Auth.$getAuth().uid));
			$scope.messages.$add({
				msg: $scope.message,
				sent: "right"
			});
			$scope.fmessages.$add({
				msg: $scope.message,
				sent: "left"
			});
			$scope.message="";
			console.log("sent");
		}
		else{
			console.log("Select a Valid ChatRoom");
		}
	}
}]);

linkTank.controller('linkTankAdminChat', ['$scope','Auth','$firebaseArray','$location', function($scope, Auth,$firebaseArray,$location){
	var refC=firebase.database().ref().child('Chatroom');
	var refU=firebase.database().ref().child('Users');
	var refUn=firebase.database().ref().child('usernames');
	$scope.messages=null;
	$scope.currentChatfUname=null;
	$scope.currentChatfUid=null;
	$scope.linkTankFriends = $firebaseArray(refU.child(Auth.$getAuth().uid).child('Friends'));
	$scope.uname=null;
	refU.child(Auth.$getAuth().uid).child("uname").once("value")
	.then(function(snapshot){
		$scope.uname=snapshot.val();
	})
	.catch(function(error){
		console.log(error);
	});

	$scope.linkTankChatroom =function(fUname, fUid){
		$scope.fUname = fUname;
		$scope.messages=$firebaseArray(refC.child(Auth.$getAuth().uid).child(fUid));
		$scope.currentChatfUname=fUname;
		$scope.currentChatfUid=fUid;
	}
	$scope.linkTankSend= function(){
		if($scope.currentChatfUname!=null){
			$scope.messages=$firebaseArray(refC.child(Auth.$getAuth().uid).child($scope.currentChatfUid));
			$scope.fmessages=$firebaseArray(refC.child($scope.currentChatfUid).child(Auth.$getAuth().uid));
			$scope.messages.$add({
				msg: $scope.message,
				sent: "right"
			});
			$scope.fmessages.$add({
				msg: $scope.message,
				sent: "left"
			});
			$scope.message="";
			console.log("sent");
		}
		else{
			console.log("Select a Valid ChatRoom");
		}
	}
}]);

linkTank.controller('linkTankContact', ['$scope','$firebaseArray', function($scope, $firebaseArray){
	var refS=firebase.database().ref().child('Suggestions');
	$scope.suggest=$firebaseArray(refS);
	$scope.message=null;
	$scope.contactForm=function(){
		$scope.suggest.$add({
			suggest_email: $scope.contactEmail,
			suggest_subject: $scope.contactSubject,
			suggest_message: $scope.contactMessage
		});
		$scope.message=$scope.contactMessage;

	}
}]);

