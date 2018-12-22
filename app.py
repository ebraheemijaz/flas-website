from flask import Flask, session, redirect, url_for, escape, request, render_template, Response
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

@app.route('/')
def index():
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
        return render_template("admin.html", data=data)
    if type_user == "1":
        all_stores = []
        conn = sqlite3.connect('database.db')
        store_records = conn.execute("SELECT stores.id, stores.storename, stores.feedback, stores.question FROM store_added INNER JOIN stores  on store_added.store_id = stores.id where user_id = " + str(session['id']))
        user_pic = conn.execute("SELECT pic_link FROM users WHERE id = " + str(id))
        user_pic = user_pic.fetchone()
        if user_pic[0] == None:
            pic_link = ' '
        else:
            pic_link = user_pic[0]
        have_store_recrod =  store_records.fetchall()
        if have_store_recrod:
            all_stores = have_store_recrod

        data = {"total_stores":len(all_stores), "stores": all_stores, "id": session['id'], "pic_link": pic_link}
        return render_template("manager.html",data=data)

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
    user_id = str(session['id'])
    store_id = ''.join(random.choice(string.ascii_lowercase + string.digits) for _ in range(16))
    logo_file= request.files.get('logo')
    file_name = str(d.now().timestamp()) + logo_file.filename 
    logo_file.save(os.getcwd()+"\\static\\img\\" + file_name)
    conn = sqlite3.connect('database.db')
    name = request.form['storename']
    question = request.form['question']
    conn = sqlite3.connect('database.db')
    conn.execute("INSERT INTO stores (id, storename, question, pic_link) VALUES ('"+store_id+"','"+name+"','"+question+"', '"+file_name+"')")
    conn.execute("INSERT INTO store_added (user_id, store_id) VALUES ('"+user_id+"','"+store_id+"')")
    conn.commit()
    return redirect(url_for('index'))

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
    record = conn.execute("select storename, question, pic_link from stores WHERE id = '" + storeid+"'")
    all_stores = record.fetchall()
    if all_stores:
        storename = all_stores[0][0]
        question = all_stores[0][1]
        pic_link = all_stores[0][2]
        return render_template("store.html", data = {"question":question, "pic_link": pic_link})
    else:
        return "Invalid Store id"

@app.route('/update_rating' , methods = ['POST'])
def update_rating():
    rating = request.form.get('rating')
    id = request.form.get('id')
    f_time = request.form.get('f_time')
    conn = sqlite3.connect('database.db')
    conn.execute("INSERT INTO user_feedback (id, email, phone, comment, time, rating) VALUES ('"+id+"','-','-','-','"+f_time+"', "+rating+")")
    conn.commit()
    rating_record = conn.execute("SELECT avg(rating) from user_feedback where id = '"+id+"'")
    record = rating_record.fetchall()
    if record:
        rating = record[0][0]
    else:
        rating = 0
    conn.execute("UPDATE stores set feedback = "+str(rating)+ " where id = '"+id+"'")
    conn.commit()
    return "done"

@app.route('/addfeedback' , methods = ['POST'])
def addfeedback():
    email = request.form.get('inputEmail4')
    tel = request.form.get('inputPassword4')
    comment = request.form.get('exampleFormControlTextarea1')
    id = request.form.get('id')
    f_time = request.form.get('f_time')
    rating = request.form.get('rating')
    conn = sqlite3.connect('database.db')
    record = conn.execute("INSERT INTO user_feedback (id, email, phone, comment, time, rating) VALUES ('"+id+"','"+email+"','"+tel+"','"+comment+"', '"+f_time+"',"+rating+")")
    conn.commit()
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
    conn = sqlite3.connect('database.db')
    conn.execute("UPDATE stores set question = '"+question+"' where id = '"+question_id+"'")
    conn.commit()
    return redirect(url_for('index'))

@app.route('/delete_question' , methods = ['POST'])
def delete_question():
    id = request.form.get('id')
    conn = sqlite3.connect('database.db')
    record = conn.execute("UPDATE stores set question = '' where id  = '" + id + "'")
    conn.commit()
    return "done"

@app.route('/getfeedback' , methods = ['POST'])
def getfeedback():
    id = request.form.get('id')
    conn = sqlite3.connect('database.db')
    record = conn.execute("SELECT * from user_feedback where id  = '"+id+"'")
    feedback = record.fetchall()
    return json.dumps(feedback)

@app.route('/updateadmin' , methods = ['POST'])
def updateadmin():
    logo_file= request.files.get('logo')
    password = request.form.get("Password")
    if logo_file:
        import os
        file_name = str(d.now().timestamp()) + logo_file.filename 
        logo_file.save(os.getcwd()+"\\static\\img\\" + file_name)
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
        import os
        file_name = str(d.now().timestamp()) + logo_file.filename 
        logo_file.save(os.getcwd()+"\\static\\img\\" + file_name)
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
    app.run(debug=True,host= "0.0.0.0", port=5000)

# {
#     'total_users': 1, 
#     'total_stores': 1, 
#     'users': [
#         (13, None, 'owner', 'owner', '1')
#     ], 
#     'stores': [
#         ('1', None, 0, None)
#     ]
# }