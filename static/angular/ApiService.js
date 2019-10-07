app.factory('adminApi', ['$http', '$cookies', function($http, $cookies) {
    config = {
        headers:{
            "Authorization":$cookies.get('userID'),
        }
    }
    function getUser(data){
        return $http.post('/getUser', data ,config)
    }

    function update(data){
        return $http.post('/update', data ,config)
    }

    function insert(data){
        return $http.post('/insertUser', data ,config)
    }

    function getAllUser(){
        return $http.post('/getAllUser', {} ,config)
    }

    function deleteiten(data){
        return $http.post('/deleteiten', data ,config)
    }

    function changeaccount(data){
        return $http.post('/changeaccount', data)
    }

    function addNewStore(data){
        return $http.post('/addNewStore', data, config)
    }

    function allStores(){
        return $http.post('/allStores', {}, config)
    }

    function updateStore(data){
        return $http.post('/updateStore', data, config)
    }

    function deleteStore(id){
        return $http.post('/deleteStore', {"id":id}, config)
    }

    function addNewAttandant(data){
        return $http.post('/addNewAttandant', data, config)
    }

    function getStore(id){
        return $http.post('/getStore', {_id:id}, config)
    }

    function addRating(data){
        data.created_at = new Date()
        if (data.type == 'attandant' && (data.comment == '' || data.comment == undefined) ){
            data.comment = ''
            data.email = ''
            data.tel = ''
        }
        return $http.post('/addRating', data, config)
    }

    function getStoreStats(data){
        return $http.post('/getStoreStats', data, config)
    }

    function getStoreComment(data){
        return $http.post('/getStoreComment', data, config)
    }

    function getAttandantStats(data){
        return $http.post('/getAttandantStats', data, config)
    }

    function showAttandantComment(data){
        return $http.post('/showAttandantComment', data, config)
    }

    function deleteAttandant(data){
        return $http.post('/deleteAttandant', data, config)
    }   

    function updateAttandant(data){
        return $http.post('/updateAttandant', data, config)
    }   
    
    return {
        getUser:getUser,
        update:update,
        insert:insert,
        getAllUser:getAllUser,
        deleteiten:deleteiten,
        changeaccount:changeaccount,
        addNewStore:addNewStore,
        allStores:allStores,
        updateStore:updateStore,
        deleteStore:deleteStore,
        addNewAttandant:addNewAttandant,
        getStore:getStore,
        addRating:addRating,
        getStoreStats:getStoreStats,
        getStoreComment:getStoreComment,
        getAttandantStats:getAttandantStats,
        showAttandantComment:showAttandantComment,
        deleteAttandant:deleteAttandant,
        updateAttandant:updateAttandant
    }
}]);