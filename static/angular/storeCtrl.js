app.controller('storeController', function($scope, $window, adminApi, $timeout, $interval) {
    storeId = $window.location.pathname.split("/")[2]
    $window.localStorage['ratings'] = JSON.stringify([]);
    $scope.pendingRequests = 0
    getstoreData()
    $scope.questionReview = (question, rating) => {
        if (question.id == $scope.currentStore.mainquestion){
            question.mainquestion = true
        }
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
        if ($scope.currentStore.showReverse == true){
            d = {
                rating: rating,
                storeId: storeId,
                type: 'attandant'
            }
            $scope.attandantRating = Object.assign({}, d, $scope.attandantRating);
            $scope.active = 'thankyou'
            $scope.startTimer(5000, rate=true)
        }
        else{
            $scope.offset = 0
            $scope.attandantRating = {}
            $scope.attandantRating.rating = rating
            $scope.attandantRating.storeId = storeId
            $scope.attandantRating.type = 'attandant'
            $scope.active = 'departments'
            $scope.startTimer(15000)
        }
    }

    $scope.attandantReview2 = (attandant) => {
        if ($scope.currentStore.showReverse == true){
            $scope.attandantRating = attandant;
            $scope.active = 'attandants'
        }
        else {
            $scope.attandantRating = Object.assign({}, attandant, $scope.attandantRating);
            $scope.active = 'thankyou'
            $scope.startTimer(5000, rate=true)
        }
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
                    if ($scope.currentStore.showReverse == false || $scope.currentStore.showReverse == undefined){
                        $scope.active = 'attandants'
                    }
                    else{
                        $scope.active = "departments"
                    }
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
                    if ($scope.currentStore.showReverse == false || $scope.currentStore.showReverse == undefined){
                        $scope.active = 'attandants'
                    }
                    else{
                        $scope.active = "departments"
                    }
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


    $scope.getDepartments = () => {
        all_dpets = $scope.currentStore.departments.split(',')
        return all_dpets
    }

    $scope.$watch('currentStore', function(){
        if ($scope.currentStore != undefined){
            var myDynamicManifest = {
                "name": "WFeedback",
                "short_name": "WFeedback",
                "theme_color": "#2196f3",
                "background_color": "#2196f3",
                "display": "fullscreen",
                "Scope": "/",
                "start_url": `/${$window.location.pathname}`,
                "icons": [
                  {
                    "src": "img/logo.png",
                    "sizes": "72x72",
                    "type": "image/png"
                  },
                  {
                    "src": "img/logo.png",
                    "sizes": "96x96",
                    "type": "image/png"
                  },
                  {
                    "src": "img/logo.png",
                    "sizes": "128x128",
                    "type": "image/png"
                  },
                  {
                    "src": "img/logo.png",
                    "sizes": "144x144",
                    "type": "image/png"
                  },
                  {
                    "src": "img/logo.png",
                    "sizes": "152x152",
                    "type": "image/png"
                  },
                  {
                    "src": "img/logo.png",
                    "sizes": "192x192",
                    "type": "image/png"
                  },
                  {
                    "src": "img/logo.png",
                    "sizes": "384x384",
                    "type": "image/png"
                  },
                  {
                    "src": "img/logo.png",
                    "sizes": "512x512",
                    "type": "image/png"
                  }
                ],
                "splash_pages": null
            }
            const stringManifest = JSON.stringify(myDynamicManifest);
            const blob = new Blob([stringManifest], {type: 'application/json'});
            const manifestURL = URL.createObjectURL(blob);
            document.querySelector('#my-manifest-placeholder').setAttribute('href', manifestURL);
        }
    })
    
})
