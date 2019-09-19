app.controller('admindashboard', function($scope, $rootScope, $route, $cookies, $window, Upload, $timeout, adminApi) {
    $scope.user = $route.current.locals.user.data.data
    $scope.allUsers = $route.current.locals.allUsers.data.data
    $scope.active = 'profile'
    $scope.update = () => {
        if($scope.user.password == '') {delete $scope.user.password}
        adminApi.update($scope.user)
    }

    $scope.insert = () => {
        adminApi.insert($scope.newuser).then(function(data){
            $scope.allUsers.push(data.data)
        })
    }

    $scope.delete = (user) => {
        adminApi.deleteiten({type:'users', '_id':user._id}).then(function(){
            $scope.allUsers = $scope.allUsers.filter(function(el) { return el._id != user._id; });
        })
    }

    $scope.uploadFiles = function (file, errFiles) {
        $scope.f = file;
        $scope.errFile = errFiles && errFiles[0];
        if (file) {
            file.upload = Upload.upload({
                url: './upload',
                data: { file: file, type: "profileimg" }
            });

            file.upload.then(function (response) {
                $timeout(function () {
                    console.log(response)
                    $scope.user.image = response.data.image;
                });
            }, function (response) {
                if (response.status > 0)
                    $scope.errorMsg = response.status + ': ' + response.data;
            }, function (evt) {
                file.progress = Math.min(100, parseInt(100.0 *
                    evt.loaded / evt.total));
            });
        }
    }

    $scope.change = (active) => {
        $scope.active = active
        if (active == 'owner'){
            adminApi.getAllUser().then(function(data){
                $scope.allUsers = data.data.data
            })
        }
    }

    $scope.changeaccount = (account) => {
        adminApi.changeaccount(account).then(function(data){
            swal("Approved", data.data.msg, "success");
            $cookies.put("role", 'a');
            $cookies.put("userID", data.data.data._id);
            $window.location.assign('./')
        })
    }

    $scope.logout = () => {
        $cookies.remove("userID")
        $cookies.remove("role")
        $window.location.assign('./')
    }
});
