app.controller('loginController', function($scope, $rootScope, $http, $cookies, $timeout, $window ,$location) {
    $scope.user = {
        username:'',
        password:''
    }
    
    $scope.login = () => {
        if ($scope.user.username == ''){
            swal("Oops", "Enter Username", "error");
            return
        }
        if ($scope.user.password == ''){
            swal("Oops", "Enter Password", "error");
            return
        }

        $http.post("/login", $scope.user).then(successCase, errorCase);
        function successCase(data){
            $cookies.put("role", data.data.data.role);
            $cookies.put("userID", data.data.data._id);
            $rootScope.user = data.data.data
            swal("Approved", data.data.msg, "success");
            $timeout($scope.redirectDashboard(data.data.data.role), 3000);
        }
        function errorCase(data){
            swal("Oops", data.data.msg, "error");
        }

    
    }

    $scope.redirectDashboard = (type) => {
        if (type == "sa") {
            $location.path("/admindashboard");
        }
        else {
            $location.path("/managerdashboard");
        }
    }

    if ($cookies.get("userID")){
        swal("Approved", "Already Login", "success");
    }
    if ($cookies.get("role")){
        $scope.redirectDashboard($cookies.get("role"))
    }
});