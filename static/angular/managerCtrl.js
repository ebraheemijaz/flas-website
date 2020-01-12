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
    $scope.storeStatRzlt = []
    $scope.storeStatComment = []
    $scope.storeAttandantRzlt = []

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

    $scope.replicate = (id) => {
        adminApi.replicate(id).then(function(){
            swal("Success", 'Dublicated successfully', "success");
            adminApi.allStores().then(function(data){
                $scope.allStores = data.data.data
            })
        }, function(){
            swal("Error", 'Dublicated Failed.', "error");
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
            console.log($scope.newStore)
            swal("Approved", 'store added successfully', "success");
            store._id = data.data._id
            $scope.allStores.push(store)
            $scope.newStore.file = ''
            $scope.newStore = {questions:[{title:'', id:Math.random().toString(36).substring(2)}], file:''}
            console.log($scope.newStore)

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
                    else if (edit == 'modifyAttandantData'){
                        $scope.modifyAttandantData.file = response.data.image;
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
        $scope.storeStatRzlt = []
        $scope.storeStatComment = []
        $scope.active = "questionstats"
    }

    $scope.getstoreStats = (stat) => {
        $scope.storeStatRzlt = []
        $scope.storeStatComment = []
        $selectedStoreStat = $scope.allStores[stat.selectedStore]
        stat.storeId = $selectedStoreStat._id
        console.log(stat)
        if (stat.selectedStoreType == "comment"){
            delete stat.id
            delete stat.selectedQuestion
            adminApi.getStoreComment(stat).then(function(data){
                $scope.storeStatComment = data.data
            })
        }
        else {
            adminApi.getStoreStats(stat).then(function(data){
                $scope.storeStatRzlt = data.data
            })
        }
    }

    $scope.getAttandantStats = (attandant) => {
        $scope.storeAttandantRzlt = []
        console.log(attandant)
        adminApi.getAttandantStats(attandant).then(function(data){
            $scope.storeAttandantRzlt = data.data
        })
    }

    $scope.showAttandantComment = (attandantId) => {
        adminApi.showAttandantComment({"id":attandantId}).then(function(data){
            $scope.attandantAllComment = data.data.data
            $('#attandantAllComment').modal(true)
        })
    }

    $scope.showstatsattandant = (attandantId) => {
        adminApi.showstatsattandant({"id":attandantId}).then(function(data){
            $scope.attandantGraphs = data.data.data
            $scope.attandantGraphs.hourlyattandseries = gerateDatahourlyattandant($scope.attandantGraphs.hourly)
            Highcharts.chart('hourlyattandantchart', {
                chart: {
                    type: 'column'
                },
                title: {
                    text: 'Hourly Rating'
                },
                xAxis: {
                    categories: $scope.attandantGraphs.hourlyattandseries.convertedtimeseries
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: 'Total Ratings'
                    },
                    stackLabels: {
                        enabled: true,
                        style: {
                            fontWeight: 'bold',
                            color: ( // theme
                                Highcharts.defaultOptions.title.style &&
                                Highcharts.defaultOptions.title.style.color
                            ) || 'gray'
                        }
                    }
                },
                legend: {
                    align: 'right',
                    x: -30,
                    verticalAlign: 'top',
                    y: 25,
                    floating: true,
                    backgroundColor:
                        Highcharts.defaultOptions.legend.backgroundColor || 'white',
                    borderColor: '#CCC',
                    borderWidth: 1,
                    shadow: false
                },
                tooltip: {
                    headerFormat: '<b>{point.x}</b><br/>',
                    pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
                },
                plotOptions: {
                    column: {
                        stacking: 'normal',
                        dataLabels: {
                            enabled: true
                        }
                    }
                },
                series: $scope.attandantGraphs.hourlyattandseries.series
            });
            $scope.active = "attandantGraphs"
        })
    }

    $scope.editAttandant = (store) => {
        $scope.attandantStoreEditModal = store
        $('#editAttandant').modal(true)
        $scope.editAttandantStore = store
    }

    $scope.modifyAttandant = (attandant) => {
        $('#editAttandant').modal('toggle');
        $('#modifyAttandant').modal(true)
        $scope.modifyAttandantData = attandant
    }

    $scope.updateAttandant = (attandant) => {
        data = {"attandantId":attandant, "storeId": $scope.editAttandantStore._id}
        adminApi.updateAttandant(data).then(function(){
            swal("Approved", 'Updated Attandant successfully', "success");
        })
    }

    $scope.deleteAttandant = (id, editAttandantStore) => {
        swal({
            title: "Are you sure?",
            text: "Once deleted, you will not be able to recover this imaginary file!",
            icon: "warning",
            buttons: true,
            dangerMode: true,
          })
          .then((willDelete) => {
            if (willDelete) {
                adminApi.deleteAttandant({"attandantId":id, "storeId": editAttandantStore._id}).then(function(){
                    swal("Approved", 'deleteAttandant successfully', "success");
                    editAttandantStore.attandants = editAttandantStore.attandants.filter(function(el) { return el.id != id; });
                })
            } else {
              swal("Nothing deleted");
            }
          });
    }
    
    $scope.showDepartments = (storeId) => {
        index= $scope.allStores.findIndex(x=>x._id === storeId)
        $scope.allDepartments  = $scope.allStores[index].departments.split(',') 
    }

    $scope.showEditDepartments = (storeId) => {
        index= $scope.allStores.findIndex(x=>x._id === storeId)
        $scope.allEditDepartments  = $scope.allStores[index].departments.split(',') 
    }
    
    function gerateDatahourlyattandant(rawvalue){
        nowtimeconverted = {}
        now = new Date()
        offsetValue = -(now.getTimezoneOffset()/60)
        for (each of Object.keys(rawvalue)){
            keyofobject = (Number(each) + 5)%24
            nowtimeconverted[String(keyofobject)+":00-" + String((keyofobject+3)%24)+":00"] = rawvalue[each]
        }
        array33=[]
        array66=[]
        array100=[]
        for (each of Object.keys(nowtimeconverted)){
            array33.push(nowtimeconverted[each]["33"])
            array66.push(nowtimeconverted[each]["66"])
            array100.push(nowtimeconverted[each]["100"])
        }
        hourlySeris = [
            {
                'name': 'Green',
                'data': array33,
                'color': '#45ed71'
            },
            {
                'name': 'Yellow',
                'data': array66,
                'color': '#edb945'
            },
            {
                'name': 'Red',
                'data': array100,
                'color': '#ed4545'
            }
        ]
        return {series: hourlySeris, convertedtimeseries:Object.keys(nowtimeconverted)}
    }
})