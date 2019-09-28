app = angular.module('wfeedBackApp', ['ngCookies', 'ngRoute', 'ngFileUpload'], function($interpolateProvider) {
    $interpolateProvider.startSymbol('[[');
    $interpolateProvider.endSymbol(']]');
})

app.filter('myDateFilter', function() {
    return function(x) {
      d = new Date(x)
      txt = d.getDate() + "/" + d.getMonth() + "/" + d.getFullYear()
      return txt;
    };
  });

