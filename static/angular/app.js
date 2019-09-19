app = angular.module('wfeedBackApp', ['ngCookies', 'ngRoute', 'ngFileUpload'], function($interpolateProvider) {
    $interpolateProvider.startSymbol('[[');
    $interpolateProvider.endSymbol(']]');
})

