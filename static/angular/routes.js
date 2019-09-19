app.config(function($routeProvider) {
    $routeProvider
    .when("/admindashboard", {
        templateUrl : "admindashboard",
        controller : "admindashboard",
        resolve:{
          user: function(adminApi){
            return adminApi.getUser()
          },
          allUsers: function(adminApi){
            return adminApi.getAllUser()
          }
        }
    })
    .when("/managerdashboard", {
      templateUrl : "managerdashboard",
      controller : "managerdashboard",
      resolve:{
        user: function(adminApi){
          return adminApi.getUser()
        },
        allStores: function(adminApi){
          return adminApi.allStores()
        }
      }
  })
    .otherwise({
      templateUrl : "login",
      controller : "loginController",
    });
});