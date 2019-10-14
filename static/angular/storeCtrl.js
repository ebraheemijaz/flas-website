app.controller('storeController', function($scope, $window, adminApi, $timeout) {
    storeId = $window.location.pathname.split("/")[2]
    getstoreData()
    $scope.questionReview = (question, rating) => {
        question.rating = rating
        question.storeId = storeId
        question.type = 'question'
        adminApi.addRating(question)
        $scope.activeQuestion = $scope.activeQuestion + 1 
        if ($scope.currentStore.questions.length - $scope.activeQuestion == 0){
            $scope.active = 'thankyou'
            $scope.startTimer(5000)
        }
    }

    $scope.selectDepartment = (name) => {
        $scope.department = name
        $scope.active = 'allAttandants'
    }

    $scope.attandantReview1 = (rating) => {
        debugger
        $scope.offset = 0
        $scope.attandantRating = {}
        $scope.attandantRating.rating = rating
        $scope.attandantRating.storeId = storeId
        $scope.attandantRating.type = 'attandant'
        $scope.active = 'departments'
        $scope.startTimer(5000)
    }

    $scope.attandantReview2 = (attandant) => {
        $scope.attandantRating = Object.assign({}, attandant, $scope.attandantRating);
        $scope.active = 'thankyou'
        $scope.startTimer(5000, rate=true)
    }
    
    $scope.leaveComment = () => {
        $scope.startTimer(5000)
        $scope.active = 'leaveComment'
    }

    $scope.submitComment = (commenter) => {
        if ($scope.currentStore.statstype == '1') {
            commenter = Object.assign({}, commenter, $scope.attandantRating);
        } else {
            commenter.storeId = storeId
            commenter.type = 'comment'
        }
        adminApi.addRating(commenter)
        $scope.currentStore.askComments = 0
        $scope.active = 'thankyou'
        $scope.startTimer(5000)
    }
    
    function getstoreData(){
        $scope.activeQuestion = 0
        adminApi.getStore(storeId).then(function(data){
            $scope.currentStore = data.data
            if ($scope.currentStore.statstype == '0') {
                if ($scope.currentStore.questions[0].title == '' && $scope.currentStore.questions.length == 1){
                    $scope.active = 'NoQuestions'
                } else {
                    $scope.active = 'questions'
                }
            }
            else if ($scope.currentStore.statstype == '1') {
                if ($scope.currentStore.attandants.length == 0){
                    $scope.active = 'NoAttandants'
                } else {
                    $scope.active = 'attandants'
                }
            }
            else if ($scope.currentStore.statstype == '2') {}
        }, function(){
            $scope.currentStore = []
        })
    }

    $scope.startTimer = (timer, rate=false) => {
        $timeout.cancel($scope.gotoquestion)
        $scope.gotoquestion = $timeout( function(){ 
            getstoreData() 
            if (rate == true){
                adminApi.addRating($scope.attandantRating)
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
})
