from flask import Flask, session, redirect, url_for, escape, request, render_template, jsonify
from flask import make_response
import json,os
import sqlite3
import random,string
from flask_socketio import SocketIO
from dateutil import parser
from datetime import datetime as d

app = Flask(__name__)
app.secret_key = "any random string"
socketio = SocketIO(app)

@app.route('/logout')
def logout():
    session.pop('id', None)
    session.pop('type', None)
    return redirect(url_for('login'))

@app.route('/login', methods = ['GET', 'POST'])
def login():
    if request.method == 'POST':
        name = request.form['id']
        password = request.form['password']
        conn = sqlite3.connect('database.db')
        records = conn.execute("Select * from users where username = '"+name+"' and password = '"+password+"'")
        user = records.fetchall()
        if user:
            session['id'] = user[0][0]
            session['type'] = user[0][-2]
            return redirect(url_for('index'))
        else:
            return render_template("login.html")
    if request.method == 'GET' and session.get('id'):
        return redirect(url_for('index'))
    return render_template("login.html")

@app.route('/', defaults={'lang': 'es'})
@app.route('/<lang>')
def index(lang):
    if 'id' not in session:
        return render_template("login.html")
    id = session['id']
    type_user = session['type']
    if type_user == "0":
        data = {}
        conn = sqlite3.connect('database.db')
        all_users = []

        user_records = conn.execute("SELECT * from users")
        have_user_record = user_records.fetchall()
        admin_user = [x for x in have_user_record if x[4] == '0'][0]
        other_user = [x for x in have_user_record if x[4] != '0']
        if other_user:
            all_users = other_user
        data={"users": all_users, "total_users":len(all_users), "pic_link": admin_user[-1]}
        return render_template(lang + "-admin.html", data=data)
    if type_user == "1":
        all_stores = []
        conn = sqlite3.connect('database.db')
        store_records = conn.execute("SELECT stores.id, stores.storename, stores.feedback, stores.question, stores.show_attandants, stores.tag_line FROM store_added INNER JOIN stores  on store_added.store_id = stores.id where user_id = " + str(session['id']))
        user_pic = conn.execute("SELECT pic_link FROM users WHERE id = " + str(id))
        user_pic = user_pic.fetchone()
        if user_pic[0] == None:
            pic_link = ' '
        else:
            pic_link = user_pic[0]
        have_store_recrod =  store_records.fetchall()
        if have_store_recrod:
            all_stores = []
            for each_store in have_store_recrod:
                conn = sqlite3.connect('database.db')
                latest_rating = conn.execute("SELECT avg(rating) AS TotalSales, strftime('%m', time) as SalesMonth FROM user_feedback where id = '"+each_store[0]+"' and strftime('%m', date('now')) = SalesMonth GROUP BY strftime('%Y', time), strftime('%m', time) ORDER BY strftime('%Y', time), strftime('%m', time)")
                latest_rating = latest_rating.fetchone()
                if latest_rating:
                    all_stores.append(list(each_store) + [latest_rating[0]])
                else:
                    all_stores.append(list(each_store) + [0])
        data = {"total_stores":len(all_stores), "stores": all_stores, "id": session['id'], "pic_link": pic_link}
        return render_template(lang + "-manager.html",data=data)


@app.route('/get_all_stores_data' , methods = ['POST'])
def get_all_stores_data():
    user_id = request.form['user_id']
    conn = sqlite3.connect('database.db')
    store_records = conn.execute("SELECT stores.id, stores.storename, stores.feedback, stores.question, show_attandants, tag_line FROM store_added INNER JOIN stores  on store_added.store_id = stores.id where user_id = " + str(user_id))
    have_store_recrod =  store_records.fetchall()
    all_stores = []
    if have_store_recrod:
        all_stores = have_store_recrod
    return jsonify({"stores": all_stores})

@app.route('/get_all_attandant_progress' , methods = ['POST'])
def get_all_attandant_progress():
    store_id = request.form['store_id']
    year = request.form['year']
    month = request.form['month']
    condition = ''
    if year and month:
        condition = " and strftime('%m', time) = '"+month+"' and strftime('%Y', time) = '"+year+"'"
    conn = sqlite3.connect('database.db')
    record = conn.execute(""" SELECT count(rating),rating, attandant_id, attendants.name, image, store_id from user_feedback INNER join attendants
            on user_feedback.attandant_id = attendants.id GROUP BY user_feedback.attandant_id, 
            user_feedback.rating having user_feedback.attandant_id != -1 and store_id = "%s" """ % store_id + condition)
    records = record.fetchall()
    comment_record = conn.execute(""" SELECT attandant_id, count(comment)  from user_feedback GROUP BY attandant_id ,id  
            having attandant_id != -1   and id = "%s"  """ % store_id + condition)
    comment_record = comment_record.fetchall()
    data = {}
    for x in records:
        if x[2] not in data:
            data[x[2]] = {}
            data[x[2]]["33"] = 0
            data[x[2]]["66"] = 0
            data[x[2]]["100"] = 0
        
        if x[1] == 33: data[x[2]]["33"] = x[0]
        if x[1] == 66: data[x[2]]["66"] = x[0]
        if x[1] == 100: data[x[2]]["100"] = x[0]
        data[x[2]]["name"] = x[3]
        data[x[2]]["image"] = x[4]
        data[x[2]]["id"] = x[2]
        total = data[x[2]]["33"] + data[x[2]]["66"] + data[x[2]]["100"]
        data[x[2]]["average"] = (data[x[2]]["33"] * 33 + data[x[2]]["66"] * 66 + data[x[2]]["100"] * 100) / total 
    high_average = 0
    for x in data.keys():
        if data[x]["average"] >= high_average:
            high_average = data[x]["average"]
    # import pdb; pdb.set_trace()
    for c_record in comment_record:
        atandant_id = c_record[0]
        data.get(atandant_id, {})["comments"] = c_record[1]
    def c(x):
        return data[x]['average']
    sortedarray = sorted(data, key= lambda x: c(x), reverse= True)
    return jsonify({"data":data, "high_average":high_average, "sorted":sortedarray})

# @app.route('/changeAttandantStatus' , methods = ['POST'])
# def changeAttandantStatus():
#     store_id = request.form['store_id']
#     show_attandants = request.form['show_attandants']
#     conn = sqlite3.connect('database.db')
#     conn.execute("UPDATE stores set show_attandants = " + show_attandants + " where id = '" + store_id + "'")
#     conn.commit()
#     return "done"

@app.route('/check_attandant_status' , methods = ['POST'])
def check_attandant_status():
    store_id = request.form['store_id']
    offset = request.form.get('offset', '0')
    conn = sqlite3.connect('database.db')
    record = conn.execute("Select tag_line from stores where id = '" + store_id + "'")
    record = record.fetchone()
    tag_line = record[0]
    record = conn.execute("SELECT id, name, image from attendants where store_id  = '" + store_id + "' limit "+offset+"*6, 6")
    all_attandants = record.fetchall()
    number_of_attandants = conn.execute("SELECT count(*) from attendants where store_id  = '" + store_id + "'")
    number_of_attandants = number_of_attandants.fetchone()
    return jsonify({"all_attandants":all_attandants, "tag_line":tag_line, "number_of_attandants":number_of_attandants[0]})
    

@app.route('/addowner' , methods = ['POST'])
def addowner():
    name = request.form['ownername']
    conn = sqlite3.connect('database.db')
    while True:
        id = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(8))
        password = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(8))
        conn.execute("INSERT INTO users (name, username, password, type) VALUES ('"+name+"','"+id+"','"+password+"', '1')")
        conn.commit()
        break
    return redirect(url_for('index'))

@app.route('/addmanager' , methods = ['POST'])
def addmanager():
    name = request.form['managersname']
    conn = sqlite3.connect('database.db')
    conn.execute("INSERT INTO manager  (name) VALUES ('"+name+"')")
    conn.commit()
    return redirect(url_for('index'))

@app.route('/addstore' , methods = ['POST'])
def addstore():
    print(request.form)
    user_id = str(session['id'])
    store_id = ''.join(random.choice(string.ascii_lowercase + string.digits) for _ in range(16))
    logo_file= request.files.get('file')
    file_name = str(d.now().timestamp()) + logo_file.filename 
    logo_file.save("static//img//" + file_name)
    conn = sqlite3.connect('database.db')
    name = request.form['storename']
    question = request.form['question']
    tag_line = request.form['tag_line']
    language = request.form['language']
    conn = sqlite3.connect('database.db')
    conn.execute("INSERT INTO stores (id, storename, question, pic_link, language, show_attandants, tag_line ) VALUES ('"+store_id+"','"+name+"','"+question+"', '"+file_name+"', '"+language+"', 1 , '"+tag_line+"')")
    conn.execute("INSERT INTO store_added (user_id, store_id) VALUES ('"+user_id+"','"+store_id+"')")
    conn.commit()
    return redirect(url_for('index'))

@app.route('/addattandant' , methods = ['POST'])
def addattandant():
    attendantname= request.form.get('attendantname')
    attendant_image= request.files.get('attendant_image')
    attandant_store= request.form.get('attandant_store')
    image_id = str(d.now().timestamp()).replace(".", "") + attendant_image.filename 
    attendant_image.save("static//img//attendant_image//" + image_id )
    conn = sqlite3.connect('database.db')
    conn.execute("INSERT INTO attendants (name, image, store_id) VALUES ('"+attendantname+"','"+image_id+"', '"+ attandant_store +"')")
    conn.commit()
    return "done"

@app.route('/updateattandant' , methods = ['POST'])
def updateattandant():
    updateAttandatName = request.form.get('updateAttandatName')
    updateAttandatId = request.form.get('updateAttandatId')
    updatedAttandantImage = request.files.get('updatedAttandantImage')
    image_update_query = ' '
    if updatedAttandantImage: 
        image_id = str(d.now().timestamp()).replace(".", "") + updatedAttandantImage.filename 
        image_update_query = ", image = '"+image_id+"'"
        updatedAttandantImage.save("static//img//attendant_image//" + image_id )
    conn = sqlite3.connect('database.db')
    conn.execute("UPDATE attendants set name = '"+updateAttandatName+"' " + image_update_query + "  where id = " + updateAttandatId)
    conn.commit()
    return make_response(jsonify({"status":"done"}), 201)

@app.route('/deleteAttandant' , methods = ['POST'])
def deleteAttandant():
    AttandatId = request.form.get('id')
    conn = sqlite3.connect('database.db')
    conn.execute("delete from attendants  where id = " + AttandatId)
    conn.commit()
    return "done"



@app.route('/get_store_graphs/<storeid>' , methods = ['GET'])
def get_store_graphs(storeid):
    conn = sqlite3.connect('database.db')
    all_feedback = conn.execute("SELECT time, rating from user_feedback where id = '"+storeid+"'")
    all_feedback_records = all_feedback.fetchall()
    final_data = {}
    for each in all_feedback_records:
         dt = parser.parse(each[0])
         month_name = dt.strftime("%B") + "," + str(dt.year)
         if month_name not in final_data.keys():
            final_data[month_name] = {}
            final_data[month_name]["33"] = 0
            final_data[month_name]["66"] = 0
            final_data[month_name]["100"] = 0
         if each[1] == 33:
             value = final_data[month_name].get("33")
             if not value:
                 value = 0
             final_data[month_name]["33"] = value + 1
         elif each[1] == 66:
             value = final_data[month_name].get("66")
             if not value:
                 value = 0
             final_data[month_name]["66"] = value + 1
         elif each[1] == 100:
             value = final_data[month_name].get("100")
             if not value:
                 value = 0
             final_data[month_name]["100"] = value + 1

    graph_data = []
    for x in final_data:
        graph_data.append({x:final_data[x]})
    
    data = {"data":graph_data, "name":"storename"}
    return json.dumps(data)

@app.route('/store/<storeid>' , methods = ['GET'])
def get_store(storeid):
    conn = sqlite3.connect('database.db')
    record = conn.execute("select storename, question, pic_link, language from stores WHERE id = '" + storeid+"'")
    all_stores = record.fetchall()
    if all_stores:
        storename = all_stores[0][0]
        question = all_stores[0][1]
        pic_link = all_stores[0][2]
        language = all_stores[0][3]
        return render_template(language + "-store.html", data = {"question":question, "pic_link": pic_link})
    else:
        return "Invalid Store id"

@app.route('/update_rating' , methods = ['POST'])
def update_rating():
    rating = request.form.get('rating')
    id = request.form.get('id')
    attandant_id = request.form.get('attandant_id', -1)
    f_time = request.form.get('f_time')
    f_time = parser.parse(request.form.get('f_time'))
    f_time = f_time.strftime('%Y-%m-%d %H:%M:%S')
    conn = sqlite3.connect('database.db')
    conn.execute("INSERT INTO user_feedback (id, email, phone, comment, time, rating, attandant_id) VALUES ('"+id+"','-','-','-','"+f_time+"', "+rating+", "+attandant_id+")")
    conn.commit()
    rating_record = conn.execute("SELECT avg(rating) from user_feedback where id = '"+id+"'")
    record = rating_record.fetchall()
    if record:
        rating = record[0][0]
    else:
        rating = 0
    conn.execute("UPDATE stores set feedback = "+str(rating)+ " where id = '"+id+"'")
    conn.commit()
    socketio.emit('updatefeedback', {"id":id, "rating":rating}, callback=messageReceived)
    return "done"

@app.route('/addfeedback' , methods = ['POST'])
def addfeedback():
    email = request.form.get('inputEmail4')
    tel = request.form.get('inputPassword4')
    comment = request.form.get('exampleFormControlTextarea1')
    id = request.form.get('id')
    attandant_id = request.form.get('attandant_id', '-1')
    f_time = parser.parse(request.form.get('f_time'))
    f_time = f_time.strftime('%Y-%m-%d %H:%M:%S')
    rating = request.form.get('rating')
    conn = sqlite3.connect('database.db')
    record = conn.execute("INSERT INTO user_feedback (id, email, phone, comment, time, rating, attandant_id) VALUES ('"+id+"','"+email+"','"+tel+"','"+comment+"', '"+f_time+"',"+rating+", "+attandant_id+")")
    conn.commit()
    rating_record = conn.execute("SELECT avg(rating) from user_feedback where id = '"+id+"'")
    record = rating_record.fetchall()
    if record:
        rating = record[0][0]
    else:
        rating = 0
    conn.execute("UPDATE stores set feedback = "+str(rating)+ " where id = '"+id+"'")
    conn.commit()
    socketio.emit('updatefeedback', {"id":id, "rating":rating}, callback=messageReceived)
    return "done"

@app.route('/delete_account' , methods = ['POST'])
def delete_account():
    id = request.form.get('id')
    conn = sqlite3.connect('database.db')
    record = conn.execute("DELETE FROM users where username = '" + id + "'")
    conn.commit()
    return "done"

@app.route('/changeaccount' , methods = ['POST'])
def changeaccount():
    username = request.form.get('id')
    conn = sqlite3.connect('database.db')
    records = conn.execute("Select * from users where username = '" + username + "'")
    user = records.fetchall()
    if user:
        session['id'] = user[0][0]
        session['type'] = user[0][-2]
    return redirect(url_for('index'))

@app.route('/update_question' , methods = ['POST'])
def update_question():
    question = request.form.get('question')
    question_id = request.form.get('question_id')
    tag_line = request.form.get('tag_line')
    conn = sqlite3.connect('database.db')
    conn.execute("UPDATE stores set question = '"+question+"', tag_line = '"+tag_line+"' where id = '"+question_id+"'")
    conn.commit()
    return jsonify({"question_id":question_id, "question":question,"tag_line":tag_line})

@app.route('/delete_question' , methods = ['POST'])
def delete_question():
    id = request.form.get('id')
    conn = sqlite3.connect('database.db')
    record = conn.execute("DELETE from stores where id  = '" + id + "'")
    conn.commit()
    return "done"

@app.route('/getfeedback' , methods = ['POST'])
def getfeedback():
    id = request.form.get('id')
    conn = sqlite3.connect('database.db')
    record = conn.execute("SELECT * from user_feedback where attandant_id  = '"+id+"' order by time desc")
    feedback = record.fetchall()
    return json.dumps(feedback)

@app.route('/updateadmin' , methods = ['POST'])
def updateadmin():
    logo_file= request.files.get('logo')
    password = request.form.get("Password")
    if logo_file:
        file_name = str(d.now().timestamp()) + logo_file.filename 
        logo_file.save("static//img//" + file_name)
        conn = sqlite3.connect('database.db')
        record = conn.execute("UPDATE users set pic_link = '"+file_name+"' where type = 0")
        conn.commit()
    if password:
        conn = sqlite3.connect('database.db')
        record = conn.execute("UPDATE users set password = '"+password+"' where type = 0")
        conn.commit()
        
    return redirect(url_for('index'))

@app.route('/updatemanger' , methods = ['POST'])
def updatemanger():
    id = request.form.get('id')
    logo_file= request.files.get('logo')
    password = request.form.get("Password")
    if logo_file:
        file_name = str(d.now().timestamp()) + logo_file.filename 
        logo_file.save("static//img//" + file_name)
        conn = sqlite3.connect('database.db')
        record = conn.execute("UPDATE users set pic_link = '"+file_name+"' where id = " + str(id))
        conn.commit()
    if password:
        conn = sqlite3.connect('database.db')
        record = conn.execute("UPDATE users set password = '"+password+"' where id = '"+id+"'")
        conn.commit()
    return redirect(url_for('index'))


def messageReceived(methods=['GET', 'POST']):
    print('message was received!!!')


connected_stores = []

@socketio.on('connect')
def connect():
    socketio.emit('getallonlinestoresres', connected_stores, callback=messageReceived)

@socketio.on('storeconnected')
def addonlinestore(json, methods=['GET', 'POST']):
    print('Client connected', request.sid)
    connected_stores.append(request.sid+","+json['id'])
    print(connected_stores)
    socketio.emit('getallonlinestoresres', connected_stores, callback=messageReceived)

@socketio.on('disconnect')
def test_disconnect():
    print('Client disconnected', request.sid)
    print('Client disconnected')
    for x in connected_stores:
        if request.sid in x:
            connected_stores.remove(x)
    socketio.emit('disgetallonlinestoresres', request.sid, callback=messageReceived)
    



if __name__ =="__main__":
    # app.run(host= "0.0.0.0", debug=True ,port=80, threaded=True)
    app.run(host= "0.0.0.0",port=80, threaded=True)