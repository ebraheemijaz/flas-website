from flask import Flask, session, redirect, url_for, escape, request, render_template
import json
import sqlite3
import random,string

app = Flask(__name__)
app.secret_key = "any random string"


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
            session['type'] = user[0][-1]
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
        all_stores = []

        user_records = conn.execute("SELECT * from users WHERE type != 0")
        have_user_record = user_records.fetchall()
        if have_user_record:
            all_users = have_user_record
        store_records = conn.execute("SELECT * from stores")
        have_store_recrod =  store_records.fetchall()
        if have_store_recrod:
            all_stores = have_store_recrod
        data={"users": all_users, "stores":all_stores, "total_stores":len(all_stores), "total_users":len(all_users)}
        return render_template("admin.html", data=data)
    if type_user == "1":
        return render_template("owner.html")

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
    name = request.form['storename']
    question = request.form['question']
    conn = sqlite3.connect('database.db')
    conn.execute("INSERT INTO stores (id, storename, question) VALUES ('"+store_id+"','"+name+"','"+question+"')")
    conn.execute("INSERT INTO store_added (user_id, store_id) VALUES ('"+user_id+"','"+store_id+"')")
    conn.commit()
    return redirect(url_for('index'))

@app.route('/get_stores_info' , methods = ['GET'])
def get_stores_info():
    data = []
    user_id = session['id']
    conn = sqlite3.connect('database.db')
    record = conn.execute("select storename, feedback from stores INNER join store_added on stores.id = store_added.store_id WHERE store_added.user_id = " + str(user_id))
    all_record = record.fetchall()
    if all_record:
        data = [{"name":x[0], "rating":x[1]} for x in all_record]
    return json.dumps(data)

@app.route('/store/<storeid>' , methods = ['GET'])
def get_store(storeid):
    conn = sqlite3.connect('database.db')
    record = conn.execute("select storename, question from stores WHERE id = '" + storeid+"'")
    all_stores = record.fetchall()
    if all_stores:
        storename = all_stores[0][0]
        question = all_stores[0][1]
        return render_template("store.html", data = {"question":question})
    else:
        return "Invalid Store id"

@app.route('/update_rating' , methods = ['POST'])
def update_rating():
    rating = request.form.get('rating')
    id = request.form.get('id')
    conn = sqlite3.connect('database.db')
    record = conn.execute("select feedback from stores WHERE id = '" + id+"'")
    all_record = record.fetchall()
    if all_record:
        feedback = all_record[0][0]
        feedback = ( feedback + int(rating) ) / 2 
        conn.execute("update stores set feedback = "+str(feedback)+" where id = '" + id + "'")
        conn.commit()
    return "done"

if __name__ =="__main__":
    app.run(debug=True)

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