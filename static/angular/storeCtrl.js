app.controller('storeController', function($scope, $window, adminApi, $timeout, $interval) {
    storeId = $window.location.pathname.split("/")[2]
    $window.localStorage['ratings'] = JSON.stringify([]);
    $scope.pendingRequests = 0
    getstoreData()
    $scope.questionReview = (question, rating) => {
        question.rating = rating
        question.storeId = storeId
        question.type = 'question'
        adminApi.addRating(question).then(function(){}, function(){storeLocally(question)})
        $scope.activeQuestion = $scope.activeQuestion + 1 
        if ($scope.currentStore.questions.length - $scope.activeQuestion == 0){
            $scope.active = 'thankyou'
            $scope.startTimer(5000)
        } else{
            $scope.startTimer(20000)
        }
    }

    $scope.selectDepartment = (name) => {
        $scope.department = name
        $scope.attandantsDepartment = $scope.currentStore.attandants.filter(function(el) { return el.department == name; });
        $scope.active = 'allAttandants'
        if ($scope.attandantsDepartment.length == 0){
            $scope.startTimer(5000)
        }
        else{
            $scope.startTimer(20000)
        }
    }

    $scope.attandantReview1 = (rating) => {
        $scope.offset = 0
        $scope.attandantRating = {}
        $scope.attandantRating.rating = rating
        $scope.attandantRating.storeId = storeId
        $scope.attandantRating.type = 'attandant'
        $scope.active = 'departments'
        $scope.startTimer(15000)
    }

    $scope.attandantReview2 = (attandant) => {
        $scope.attandantRating = Object.assign({}, attandant, $scope.attandantRating);
        $scope.active = 'thankyou'
        $scope.startTimer(20000, rate=true)
    }
    
    $scope.leaveComment = () => {
        $scope.startTimer(50000)
        $scope.active = 'leaveComment'
    }

    $scope.submitComment = (commenter) => {
        if ($scope.currentStore.statstype == '1') {
            commenter = Object.assign({}, commenter, $scope.attandantRating);
        } else {
            commenter.storeId = storeId
            commenter.type = 'comment'
        }
        adminApi.addRating(commenter).then(function(){}, function(){storeLocally(commenter)})
        $scope.showCommentBox = false
        $scope.active = 'thankyou'
        $scope.startTimer(5000)
    }
    
    $scope.changeOffset = (offset) => {
        $scope.startTimer(15000)
        $scope.offset = $scope.offset + offset
    }

    function getstoreData(){
        $scope.activeQuestion = 0
        adminApi.getStore(storeId).then(function(data){
            $scope.currentStore = data.data
            $scope.latestData = $scope.currentStore
            if ($scope.currentStore.statstype == '0') {
                if ($scope.currentStore.questions[0].title == '' && $scope.currentStore.questions.length == 1){
                    $scope.active = 'NoQuestions'
                } else {
                    $scope.active = 'questions'
                }
                $scope.showCommentBox = true
            }
            else if ($scope.currentStore.statstype == '1') {
                if ($scope.currentStore.attandants.length == 0){
                    $scope.active = 'NoAttandants'
                } else {
                    $scope.active = 'attandants'
                }
                $scope.showCommentBox = true
            }
        }, function(){
            $scope.currentStore = $scope.latestData
            if ($scope.currentStore.statstype == '0') {
                if ($scope.currentStore.questions[0].title == '' && $scope.currentStore.questions.length == 1){
                    $scope.active = 'NoQuestions'
                } else {
                    $scope.active = 'questions'
                }
                $scope.showCommentBox = true
            }
            else if ($scope.currentStore.statstype == '1') {
                if ($scope.currentStore.attandants.length == 0){
                    $scope.active = 'NoAttandants'
                } else {
                    $scope.active = 'attandants'
                }
                $scope.showCommentBox = true
            }
        })
    }

    $scope.startTimer = (timer, rate=false) => {
        $timeout.cancel($scope.gotoquestion)
        $scope.gotoquestion = $timeout( function(){ 
            getstoreData() 
            if (rate == true){
                adminApi.addRating($scope.attandantRating).then(function(){}, function(){storeLocally($scope.attandantRating)})
            }
        }, timer );
    }

    console.log($window.location)
    var socket = io.connect('http://' + $window.location.host + ':' + $window.location.port);
    socket.on( 'connect', function() {
      socket.emit( 'storeconnected', {
            id: storeId
        } 
    )})


    function storeLocally(data){
        list = []
        list = JSON.parse($window.localStorage['ratings'])
        list.push(data)
        $scope.pendingRequests = list.length
        $window.localStorage['ratings'] = JSON.stringify(list);
    }

    $interval(function() {
        list = []
        list = JSON.parse($window.localStorage['ratings'])
        if (list.length != 0){
            data = list.pop()
            $window.localStorage['ratings'] = JSON.stringify(list);
            adminApi.addRating(data).then(function(){
                $scope.pendingRequests = $scope.pendingRequests - 1 
            }, function(){storeLocally(data)})
        }
    }, 5 * 60000);
})
