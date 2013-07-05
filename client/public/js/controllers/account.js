Modules.controllers.controller('AccountController', ['$routeParams', '$rootScope', '$scope', '$http', '$location',  'Session', 'User', 'ChatUser',
    function($routeParams, $rootScope, $scope, $http, $location, Session, User, ChatUser) {
    
    $scope.userInformation = {}; //Personal information from session / for update
    $scope.otherUserInfo = {}; //Anonym user info
    
    $scope.validations = {
        anonymUser: true,
        anonymOtherUser: true
    };
    
    $scope.userInformation = {
        username: '',
        email: '',
        name: '',
        gender: '',
        avatar: '',
        description: '',
        location: '',
        birth: ''
    };
    
    //get user session
    $scope.loadInfo = function () {
        Session.get(function(response) {
            if ((response !== null ? response._id : void 0) !== null) {
                if (response._id !== null && response._id !== undefined){
                    $scope.userInformation = response;
                    $scope.validations.anonymUser = false;
                }
            }
            
            //validacion de información
            if ($scope.userInformation.username === undefined || $scope.userInformation.username === ''){
                ChatUser.getUsername({username: 'get'},
                function(response) {
                    $scope.userInformation.username = 'anonym' + response.count;
                }, function(response) {
                    //error
                });
            }
            
            if ($scope.userInformation.email === undefined || $scope.userInformation.email === ''){$scope.userInformation.email = "";}
            if ($scope.userInformation.name === undefined || $scope.userInformation.name === ''){$scope.userInformation.name = $scope.userInformation.username;}
            if ($scope.userInformation.gender === undefined || $scope.userInformation.gender === ''){$scope.userInformation.gender = "";}
            if ($scope.userInformation.avatar === undefined || $scope.userInformation.avatar === ''){$scope.userInformation.avatar = "server/uploads/images/avatars/default.jpg";}
            if ($scope.userInformation.description === undefined || $scope.userInformation.description === ''){$scope.userInformation.description = "";}
            if ($scope.userInformation.location === undefined || $scope.userInformation.location === ''){$scope.userInformation.location = "";}
            if ($scope.userInformation.birth === undefined || $scope.userInformation.birth === ''){$scope.userInformation.birth = "";}
            
        }, function(response) {
            //error
        });
    };
    
    //upload images
    $scope.uploadImage = function(content){
        console.log('entro: ' + content);
    };
    
    //update user info
    $scope.updateUsers = function () {
        User.update($scope.userInformation,
        function (data) {
            console.log('modificó');
        }, function ($http) {
            //error
            console.log("Couldn't save user.");
        });
    };
    
    //get other user info
    $scope.otherUser = function (){
        if($scope.userInformation.username !== undefined && $scope.userInformation.username !== ''){
            ChatUser.get({username: $scope.userInformation.username},
            function(response) {
                $scope.validations.anonymOtherUser = false;
                $scope.otherUserInfo = response;
                console.log('response: ' + JSON.stringify(response));
            }, function(response) {
                switch (response.status) {
                case 404:
                    $scope.otherUserInfo.username = response.data;
                    break;
                }
            });
        }
    };
}]);
