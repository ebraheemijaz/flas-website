app.controller('managerdashboard', function($scope, $rootScope, $route, $cookies, $window, Upload, $timeout, adminApi) {
    $scope.active = 'profile'
    $scope.monthsName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    $scope.user = $route.current.locals.user.data.data
    $scope.allStores = $route.current.locals.allStores.data.data
    $scope.newStore = {
        storename: '',
        tag_line: '',
        file: '',
        language: '',
        questions:[{title:'', id:Math.random().toString(36).substring(2)}]
    }
    $scope.newAttendant = {
        name: '',
        storeId: '',
        file: '',
        id:Math.random().toString(36).substring(2)
    }

    $scope.addQuestion = (newStore) => {
        newStore.questions.push({'title':'', 'id':Math.random().toString(36).substring(2)})
    }

    $scope.editStore = (store) => {
        $scope.editStoreData = store
        console.log(store)
        $('#editStore').modal(true)
    }

    $scope.updateStore = (store) => {
        adminApi.updateStore(store).then(function(){
            swal("Approved", 'store updated successfully', "success");
        })
    }

    $scope.deleteStore = (id) => {  
        swal({
            title: "Are you sure?",
            text: "Once deleted, you will not be able to recover this imaginary file!",
            icon: "warning",
            buttons: true,
            dangerMode: true,
          })
          .then((willDelete) => {
            if (willDelete) {
                adminApi.deleteStore(id).then(function(){
                    swal("Approved", 'deleteed successfully', "success");
                    $scope.allStores = $scope.allStores.filter(function(el) { return el._id != id; });
                })
            } else {
              swal("Nothing deleted");
            }
          });
    }

    $scope.update = () => {
        if($scope.user.password == '') {delete $scope.user.password}
        adminApi.update($scope.user).then(function(){
            swal("Approved", 'updated successfully', "success");
        })
    }

    $scope.addNewStore = (store) => {
        adminApi.addNewStore(store).then(function(data){
            swal("Approved", 'store added successfully', "success");
            store._id = data.data._id
            $scope.allStores.push(store)
            $scope.newStore = {questions:[{title:'', id:Math.random().toString(36).substring(2)}]}
        })
    }

    $scope.addNewAttandant = (attandant) => {
        adminApi.addNewAttandant(attandant).then(function(data){
            swal("Approved", 'Attandant added successfully', "success");
            $scope.newAttendant = {
                name: '',
                storeId: '',
                file: '',
                id:Math.random().toString(36).substring(2)
            }
        })
    }

    $scope.uploadFiles = function (file, errFiles,edit=false) {
        $scope.f = file;
        $scope.errFile = errFiles && errFiles[0];
        if (file) {
            file.upload = Upload.upload({
                url: './upload',
                data: { file: file, type: "profileimg" }
            });

            file.upload.then(function (response) {
                $timeout(function () {
                    if (edit == 'newAttendant'){
                        $scope.newAttendant.file = response.data.image;
                    }
                    else if (edit == 'store'){
                        $scope.user.image = response.data.image;
                    }
                    else if (edit == true){
                        $scope.editStoreData.file = response.data.image;
                    }
                    else{
                        $scope.newStore.file = response.data.image;
                    }
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
        if (active == 'stores'){
            adminApi.allStores().then(function(data){
                $scope.allStores = data.data.data
            })
            $scope.newStore = {questions:[{title:'', id:Math.random().toString(36).substring(2)}]}
        }
    }

    $scope.logout = () => {
        $cookies.remove("userID")
        $cookies.remove("role")
        $window.location.assign('./')
    }

    console.log($window.location)
    var socket = io.connect('http://' + $window.location.host + ':' + $window.location.port);
    socket.on('connect', function () {
        console.log("connected")
    })
    socket.on('getallonlinestoresres', function (allOnline) {
        $rootScope.online = allOnline
        console.log($rootScope.online)
        $scope.$apply();
    })
    socket.on('disgetallonlinestoresres', function (allOnline) {
        $rootScope.online.splice($rootScope.online.indexOf(allOnline), 1);
        console.log($rootScope.online)
        $scope.$apply();
    })


    // section store stats
    $scope.statsStore = (storeId) => {
        $scope.active = "questionstats"
    }

    $scope.getstoreStats = (stat) => {
        $selectedStoreStat = $scope.allStores[stat.selectedStore]
        stat.storeId = $selectedStoreStat._id
    }
    
})