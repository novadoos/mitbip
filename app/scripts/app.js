'use strict';

//Modules var and resources route
var Modules = {
  controllers: angular.module('talkusApp.controllers', ['talkusApp.resources'])
};

var App = angular.module('talkusApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngRoute',
  'ngUpload',
  'talkusApp.controllers',
  'talkusApp.directives',
  'talkusApp.filters',
  'talkusApp.resources'
]);

App.config(function ($routeProvider, $locationProvider, $httpProvider) {
  $routeProvider
    .when('/', {templateUrl: '/partials/index', controller: 'LoginController'})
    .when('/chat', {templateUrl: '/partials/chat', controller:  'AccountController'})
    .otherwise({redirectTo: '/'});
  $locationProvider.html5Mode(true);
});