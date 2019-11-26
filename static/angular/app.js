app = angular.module('wfeedBackApp', ['ngCookies', 'ngRoute', 'ngFileUpload'], function($interpolateProvider) {
    $interpolateProvider.startSymbol('[[');
    $interpolateProvider.endSymbol(']]');
})

app.filter('myDateFilter', function() {
    return function(x) {
      d = new Date(x)
      txt = d.getDate() + "/" + Number(d.getMonth()+1) + "/" + d.getFullYear()
      return txt;
    };
  });

app.filter('myTimeFilter', function() {
  return function(x) {
    d = new Date(x)
    txt = d.getHours() + ":" + d.getMinutes()
    return txt;
  };
});
  
