Modules.controllers.controller('LoginController', ['$rootScope', '$scope', '$http', '$location', 'Session', 'User', 
    function($rootScope, $scope, $http, $location, Session , User) {

    //Validations
    $scope.permissions = {
        invalidUserInfo: false
    };
    
    $scope.validations = {
        duplicatedEmail: false,
        duplicatedUser: false,
        invalidEmailFormat: false,
        invalidUsername: false
    };
    
    $scope.loginValidations = {
        userSessionExist: false
    };
    
    $scope.succesMesages = {
        creationSucces: false
    };
    
    //Session
    $scope.session = new Session();
    //User
    $scope.userObject = new User();
    
    //Redireccion si ya está logueado
    Session.get(function(response) {
        if ((response !== null ? response._id : void 0) !== null) {
            if (response._id !== null && response._id !== undefined){
                $scope.loginValidations.userSessionExist = true;
                $location.path("/welcome");
            }
        }
    }, function(response) {
        //error
    });
            
    //Login action button
    $scope.submitLogin = function () {
        
        $scope.session.$save(function(res) {
            $rootScope.user = res;
            $scope.permissions.invalidUserInfo = false;
            $location.path("/chat");
        },
        function(res){
            switch (res.status) {
                case 403:
                    $scope.permissions.invalidUserInfo = true; //Invalid user or password
            }
        });
    };
    
    //Register action button
    $scope.submitRegister = function () {
        $scope.userObject.$save(function(res){
            $scope.permissions.invalidUserInfo = false;
            $scope.validations.invalidEmailFormat = false;
            $scope.validations.invalidUsername = false;
            $scope.succesMesages.creationSucces = true;
        },
        function(res){
            switch (res.status) {
                case 400:
                    var countErrors = res.data.errors.length;
                    for (var i = 0; i < countErrors; i++){
                        switch (res.data.errors[i].path) {
                            case 'email':
                                $scope.validations.invalidEmailFormat = true;
                                break;
                            case 'username':
                                $scope.validations.invalidUsername = true;
                                break;
                        }
                    }
                    break;
            }
        });
    };
    
    
}]);
