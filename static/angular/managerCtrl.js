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
    $scope.stats = {}

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

    $scope.showstatsattandant = (attandantId, month, year) => {
        adminApi.showstatsattandant({"id":attandantId, month:month, year:year}).then(function(data){
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
                    categories: ["00-03h","03-06h","06-09h","09-12h","12-15h","15-18h","18-21h","21-00h"]
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

            $scope.attandantGraphs.dayattandseries = gerateDatadaysyattandant($scope.attandantGraphs.days)
            Highcharts.chart('daysattandantchart', {
                chart: {
                    type: 'column'
                },
                title: {
                    text: 'Day Wise Rating'
                },
                xAxis: {
                    categories: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
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
                series: $scope.attandantGraphs.dayattandseries.series
            });

            $scope.active = "attandantGraphs"
        })
    }

    $scope.showgraphsquestionmonth = (month, year) => {
        storeID = $scope.stats.storeId
        adminApi.showgraphsquestionmonth({"id":storeID, month:month, year:year}).then(function(data){
            $scope.questionGraphs = data.data.data
            $scope.questionGraphs.hourlyattandseries = gerateDatahourlquestion($scope.questionGraphs.hourly)
            Highcharts.chart('hourlyquestionchart', {
                chart: {
                    type: 'column'
                },
                title: {
                    text: 'Hourly Rating (All Questions)'
                },
                xAxis: {
                    categories: ["00-03h","03-06h","06-09h","09-12h","12-15h","15-18h","18-21h","21-00h"]
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
                series: $scope.questionGraphs.hourlyattandseries.series
            });

            $scope.questionGraphs.dayquestionseries = gerateDatadaysyquestion($scope.questionGraphs.days)
            Highcharts.chart('daysquestionchart', {
                chart: {
                    type: 'column'
                },
                title: {
                    text: 'Day Wise Rating (All Question)'
                },
                xAxis: {
                    categories: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
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
                series: $scope.questionGraphs.dayquestionseries.series
            });

            $scope.questionGraphs.comparequestionseries = gerateDatacompareyquestion($scope.questionGraphs.compare)
            Highcharts.chart('comparequestionchart', {
                chart: {
                    type: 'bar'
                },
                title: {
                    text: 'Comparison Graph'
                },
                xAxis: {
                    categories: $scope.questionGraphs.comparequestionseries.categories
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: 'Total Rating'
                    }
                },
                legend: {
                    reversed: false
                },
                plotOptions: {
                    series: {
                        stacking: 'normal'
                    }
                },
                series: $scope.questionGraphs.comparequestionseries.series
            });
            $scope.active = "questionGraphs"
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
        convertedData = []
        now = new Date()
        offsetValue = - (now.getTimezoneOffset()/60)
        for (each of rawvalue){
            key = (each._id + offsetValue)%24
            convertedData.push({_id:key, 33: each['33'], 66: each['66'], 100: each['100']})
        }
        array33=[]
        array66=[]
        array100=[]
        for (i=0;i<24;i=i+3){
            filteredData = convertedData.filter(function(item){ return item._id >= i && item._id < i+3})
            v33 = 0
            v66 = 0
            v100 = 0
            for (eachfilterdata of filteredData){
                v33 = v33 + eachfilterdata[33]
                v66 = v66 + eachfilterdata[66]
                v100 = v100 + eachfilterdata[100]
            }
            array33.push(v33)
            array66.push(v66)
            array100.push(v100)
        }
        hourlySeris = [
            {
                'name': 'Green',
                'data': array100,
                'color': '#45ed71'
            },
            {
                'name': 'Yellow',
                'data': array66,
                'color': '#edb945'
            },
            {
                'name': 'Red',
                'data': array33,
                'color': '#ed4545'
            }
        ]
        return {series: hourlySeris}
    }
    function gerateDatadaysyattandant(rawvalue){
        array33=[0,0,0,0,0,0,0]
        array66=[0,0,0,0,0,0,0]
        array100=[0,0,0,0,0,0,0]
        for (each of rawvalue){
            array33[each._id -1] = array33[each._id -1] + each["33"]
            array66[each._id -1] = array66[each._id -1] + each["66"]
            array100[each._id -1] = array100[each._id -1] + each["100"]
        }
        daySeris = [
            {
                'name': 'Green',
                'data': array100,
                'color': '#45ed71'
            },
            {
                'name': 'Yellow',
                'data': array66,
                'color': '#edb945'
            },
            {
                'name': 'Red',
                'data': array33,
                'color': '#ed4545'
            }
        ]
        return {series: daySeris}
    }

    function gerateDatahourlquestion(rawvalue){
        convertedData = []
        now = new Date()
        offsetValue = - (now.getTimezoneOffset()/60)
        for (each of rawvalue){
            key = (each._id + offsetValue)%24
            convertedData.push({_id:key, 33: each['33'], 66: each['66'], 100: each['100']})
        }
        array33=[]
        array66=[]
        array100=[]
        for (i=0;i<24;i=i+3){
            filteredData = convertedData.filter(function(item){ return item._id >= i && item._id < i+3})
            v33 = 0
            v66 = 0
            v100 = 0
            for (eachfilterdata of filteredData){
                v33 = v33 + eachfilterdata[33]
                v66 = v66 + eachfilterdata[66]
                v100 = v100 + eachfilterdata[100]
            }
            array33.push(v33)
            array66.push(v66)
            array100.push(v100)
        }
        hourlySeris = [
            {
                'name': 'Green',
                'data': array100,
                'color': '#45ed71'
            },
            {
                'name': 'Yellow',
                'data': array66,
                'color': '#edb945'
            },
            {
                'name': 'Red',
                'data': array33,
                'color': '#ed4545'
            }
        ]
        return {series: hourlySeris}
    }

    function gerateDatadaysyquestion(rawvalue){
        array33=[0,0,0,0,0,0,0]
        array66=[0,0,0,0,0,0,0]
        array100=[0,0,0,0,0,0,0]
        for (each of rawvalue){
            array33[each._id -1] = array33[each._id -1] + each["33"]
            array66[each._id -1] = array66[each._id -1] + each["66"]
            array100[each._id -1] = array100[each._id -1] + each["100"]
        }
        daySeris = [
            {
                'name': 'Green',
                'data': array100,
                'color': '#45ed71'
            },
            {
                'name': 'Yellow',
                'data': array66,
                'color': '#edb945'
            },
            {
                'name': 'Red',
                'data': array33,
                'color': '#ed4545'
            }
        ]
        return {series: daySeris}
    }

    function gerateDatacompareyquestion(rawvalue){
        debugger
        store = $scope.allStores.filter(function(item){ return item._id == $scope.stats.storeId})
        categories = []
        carray33=[]
        carray66=[]
        carray100=[]
        for (eachQuestion of store[0].questions){
            question_id = eachQuestion.id
            questn_row = rawvalue.filter(function(item){ return item._id == question_id})
            if (questn_row){
                categories.push(eachQuestion.title)
                carray33.push(questn_row[0]['33'])
                carray66.push(questn_row[0]['66'])
                carray100.push(questn_row[0]['100'])
            }
        }

        compareSeris = [
            {
                'name': 'Green',
                data: carray100,
                'color': '#45ed71'
            }, 
            {
                'name': 'Yellow',
                data: carray66,
                'color': '#edb945'
            }, 
            {
                'name': 'Red',
                data: carray33,
                'color': '#ed4545'
            }
        ]
        return {series: compareSeris, categories: categories}
    }
})