from flask import Flask, session, redirect, url_for, escape, request, render_template, jsonify
from flask import make_response
import json,os
import sqlite3
import random,string
from flask_socketio import SocketIO
from dateutil import parser
import datetime
from database import databaseclass
from bson.objectid import ObjectId
from dateutil.relativedelta import relativedelta
from bson.objectid import ObjectId


app = Flask(__name__)
app.secret_key = "any random string"
socketio = SocketIO(app)
db = databaseclass()
language = {
    "es":{
        "thank":"Thank You",
        "leavecomment":"Leave a Comment",
        "comment":"Comment",
        "next":"Next",
        "telephone": "Telephone/Whatsapp"

    },
    "sp":{
        "thank":"Gracias",
        "leavecomment":"Deje su comentario",
        "comment":"Comentario",
        "next":"Siguiente",
        "telephone": "Telephone/Whatsapp"
    },
    "pg":{
        "thank":"Obrigado",
        "leavecomment":"Deixe o seu comentário",
        "comment":"Comente",
        "next":"Próximo",
        "telephone": "Telefone/Whatsapp"
    }
}

def getData(col, query, projection={}, all=False, makeResponse = True):
    found_data = db.find(col = col, query = query, projection=projection)
    if not makeResponse: return found_data
    if found_data:
        data = found_data if all else found_data[0]
        msg = "User Found"
        res = make_response(jsonify({"data":data, "msg":msg}), 200)
    else:
        msg = "User Not Found"
        res = make_response(jsonify({"data":[], "msg":msg}), 404)
    return res

@app.route('/')
def index():
    return render_template("app.html")

@app.route('/login')
def login():
    return render_template("login.html")

@app.route('/login', methods=['POST'])
def loginPost():
    user = request.json
    data= getData('users', user)
    return data

@app.route('/admindashboard')
def admindashboard():
    return render_template("admindashboard.html")

@app.route('/managerdashboard')
def managerdashboard():
    return render_template("managerdashboard.html")

@app.route('/sectionstores')
def sectionstores():
    return render_template("sectionstores.html")

@app.route('/sectionattandants')
def sectionattandants():
    return render_template("sectionattandants.html")

@app.route('/questionstats')
def questionstats():
    return render_template("questionstats.html")

@app.route('/stores/<id>')
def store(id):
    return render_template("store.html")

@app.route('/getUser', methods=['POST'])
def getUser():
    user_id = request.headers.get('Authorization')
    data= getData('users', {'_id': ObjectId(user_id)}, {'password':0, 'role':0})
    return data

@app.route('/changeaccount', methods=['POST'])
def changeaccount():
    data = request.json
    data['_id'] = ObjectId(data['_id'])
    data= getData('users', data, {'password':0, 'role':0})
    return data

@app.route('/getAllUser', methods=['POST'])
def getAllUser():
    user_id = request.headers.get('Authorization')
    data= getData('users', {'role': 'a'}, {'role':0}, all=True, makeResponse=False)
    return make_response(jsonify({"data":data, "msg":"msg"}), 200)

@app.route('/deleteiten', methods=['POST'])
def deleteiten():
    user_id = request.headers.get('Authorization')
    data = request.json
    col = data.get('type')
    id =  ObjectId(data.get('_id'))
    data= db.delete(col, id)
    return data

@app.route('/insertUser', methods=['POST'])
def insertUser():
    user_id = request.headers.get('Authorization')
    data = request.json
    data['username'] = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(8))
    data['password'] = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(8))
    data['role'] = 'a'
    data= db.insert('users', data)
    data['_id'] = str(data['_id'])
    data.pop("role")
    return data

    
@app.route('/update', methods=['POST'])
def update():
    user_id = request.headers.get('Authorization')
    data= db.update('users', {'_id': ObjectId(user_id)}, request.json)
    return data

@app.route('/upload', methods=['POST'])
def upload():
    filetype = request.form.get('type')
    filename = request.files.to_dict()['file'].filename
    if filetype == 'profileimg':
        path = "./static/img/"
    path = path + filename
    request.files.to_dict()['file'].save(path)
    return make_response(jsonify({"image":path}), 200)
    
@app.route('/addNewStore', methods=['POST'])
def addNewStore():
    data = request.json
    user_id = request.headers.get('Authorization')
    data['user_id'] = user_id
    data['attandants'] = []
    _id = db.insert('stores', data).get('_id')
    return make_response(jsonify({"status":"done", "_id": str(_id)}), 200)

@app.route('/addNewAttandant', methods=['POST'])
def addNewAttandant():
    data = request.json
    data['_id'] = data.pop('storeId')
    _id = db.update('stores', id = data.get('storeId'), data=data, push = True)
    return make_response(jsonify({"status":"done", "_id": str(_id)}), 200)

    

@app.route('/updateStore', methods=['POST'])
def updateStore():
    data = request.json
    store_id = ObjectId(data.get('_id'))
    data= db.update('stores', {'_id': store_id}, data)
    return data

@app.route('/allStores', methods=['POST'])
def allStores():
    user_id = request.headers.get('Authorization')
    data = getData('stores', {'user_id': user_id}, all=True, makeResponse=False)
    return make_response(jsonify({"data":data, "msg":"msg"}), 200)

@app.route('/deleteStore', methods=['POST'])
def deleteStore():
    store_id = request.json.get('id')
    data= db.delete('stores', ObjectId(store_id))
    return data

@app.route('/deleteAttandant', methods=['POST'])
def deleteAttandant():
    data = request.json
    db.deleteAttandant('stores', data)
    db.deleterating(data)
    return data

@app.route('/updateAttandant', methods=['POST'])
def updateAttandant():
    data = request.json
    db.updateAttandant('stores', data)
    db.updaterating(data)
    return data


@app.route('/stores/get/getmanifest.json', methods=['GET'])
def getStoreManifest():
    return jsonify({
        "name": "WFeedback",
        "short_name": "WFeedback",
        "theme_color": "#2196f3",
        "background_color": "#2196f3",
        "display": "fullscreen",
        "Scope": "/",
        "start_url": request.headers['Referer'],
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
            "src": "images/icons/icon-152x152.png",
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
        "splash_pages": ''
  })

@app.route('/getStore', methods=['POST'])
def getStore():
    data = request.json
    data = getData('stores', {'_id': ObjectId(data.get("_id"))}, {"user_id":0}, makeResponse = False)
    data = data[0] if data else data
    if data.get("language") == "es":
        data["language"] = language.get("es")
    elif data.get("language") == "sp":
        data["language"] = language.get("sp")
    elif data.get("language") == "pg":
        data["language"] = language.get("pg")
    return data

@app.route('/addRating', methods=['POST'])
def addRating():
    data = request.json
    import datetime;
    data['created_at'] = datetime.datetime.utcnow()
    print(data['created_at'])
    data= db.insert('rating', data)
    return "done"

@app.route('/getStoreStats', methods=['POST'])
def getStoreStats():
    data = request.json
    return jsonify(db.getgetStoreStats(data))

@app.route('/getAttandantStats', methods=['POST'])
def getAttandantStats():
    data = request.json
    return jsonify(db.getAttandantStats(data))

@app.route('/showAttandantComment', methods=['POST'])
def showAttandantComment():
    query = request.json
    query['comment'] =  { '$ne': '' }
    dataArray = getData('rating', query, all=True, makeResponse=False)
    dataArray = dataArray[::-1]
    return make_response(jsonify({"data":dataArray, "msg":"done"}), 200)

@app.route('/showstatsattandant', methods=['POST'])
def showstatsattandant():
    dataArray = db.getratings('attandant', request.json['id'])
    resData = {}
    resData['hourly'] = {
         "0" :{ "33":0, "66":0, "100":0 },
         "3" :{ "33":0, "66":0, "100":0 },
         "6" :{ "33":0, "66":0, "100":0 },
         "9" :{ "33":0, "66":0, "100":0 },
         "12":{ "33":0, "66":0, "100":0 },
         "15":{ "33":0, "66":0, "100":0 },
         "18":{ "33":0, "66":0, "100":0 },
         "21":{ "33":0, "66":0, "100":0 },
    }
    for x in dataArray:
        try:
            hour = ''
            if x['created_at'].hour >= 0 and x['created_at'].hour < 3:
                hour = "0" 
            elif x['created_at'].hour >= 3 and x['created_at'].hour < 6:
                hour = "3" 
            elif x['created_at'].hour >= 6 and x['created_at'].hour < 9:
                hour = "6" 
            elif x['created_at'].hour >= 9 and x['created_at'].hour < 12:
                hour = "9" 
            elif x['created_at'].hour >= 12 and x['created_at'].hour < 15:
                hour = "12"
            elif x['created_at'].hour >= 15 and x['created_at'].hour < 18:
                hour = "15"
            elif x['created_at'].hour >= 18 and x['created_at'].hour < 21:
                hour = "18"
            elif x['created_at'].hour >= 21 and x['created_at'].hour < 24:
                hour = "21"

            if hour != '':
                if x['rating'] == 33:
                    resData['hourly'][hour]["33"] = resData['hourly'][hour]["33"] + 1
                elif x['rating'] == 66:
                    resData['hourly'][hour]["66"] = resData['hourly'][hour]["66"] + 1
                elif x['rating'] == 100:
                    resData['hourly'][hour]["100"] = resData['hourly'][hour]["100"] + 1
            
            
        except Exception as ex:
            print(ex)
    return make_response(jsonify({"data":resData, "msg":"done"}), 200)


@app.route('/replicate', methods=['POST'])
def replicate():
    query = request.json
    pstore = db.find("stores", {'_id': ObjectId(query['_id'])})[0]
    pstore.pop('_id')
    db.insert("stores", pstore)
    return 'make_response(jsonify({"data":dataArray, "msg":"done"}), 200)'

    

@app.route('/getStoreComment', methods=['POST'])
def getStoreComment():
    data = request.json
    query = { 
        "id" : data.get('selectedQuestion'), 
        'storeId': data.get('storeId'),
        "type":'comment'
    }
    if data.get("month") and data.get("year"):
        dateTime = parser.parse(f"{data.get('year')}-{data.get('month')}-01T00:00:00.0Z")
        query.update({
            'created_at': {
                '$gte': dateTime, 
                '$lt': dateTime + relativedelta(months=1)
            }
        })
    return jsonify(db.find('rating', query, {"_id":0}))

def messageReceived(methods=['GET', 'POST']):
    print('message was received!!!')


connected_stores = []

@socketio.on('connect')
def connect():
    socketio.emit('getallonlinestoresres', [x['storeId'] for x in connected_stores], callback=messageReceived)

@socketio.on('storeconnected')
def addonlinestore(json, methods=['GET', 'POST']):
    print('Client connected', request.sid)
    connected_stores.append( {'storeId': json['id'], 'socketId': request.sid } )
    socketio.emit('getallonlinestoresres', [x['storeId'] for x in connected_stores], callback=messageReceived)

@socketio.on('disconnect')
def test_disconnect():
    print('Client disconnected', request.sid)
    for x in connected_stores:
        if request.sid in x['socketId']:
            connected_stores.remove(x)
    socketio.emit('disgetallonlinestoresres', [] if len(connected_stores)==0 else x['storeId'], callback=messageReceived)
    



if __name__ =="__main__":
    # app.run(host= "0.0.0.0", debug=True ,port=80, threaded=True)
    app.run(host= "0.0.0.0",port=80, threaded=True)