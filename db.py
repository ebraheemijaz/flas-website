a = [
"CREATE TABLE user (id TEXT, name TEXT, password TEXT, type TEXT)",
"INSERT INTO user (id, name, password, type) VALUES ('id','admin', 'admin12345.', '0')",
"Select * from user where id = id and password = password",
"CREATE TABLE stores (id Text, name TEXT, owner TEXT, manager TEXT)",
"INSERT INTO stores (id, name, owner, manager) VALUES ('storeid1' ,'storename1', 'storeowner1', 'storemanager1')",
"CREATE TABLE manager (name TEXT)",
"INSERT INTO manager (name) VALUES ('manger1')",
"CREATE TABLE owner (name TEXT)",
"INSERT INTO owner (name) VALUES ('owner1')",
"CREATE TABLE employees (id TEXT ,name TEXT, pic TEXT, store_id TEXT)",
"INSERT INTO employees (id, name, pic, store_id) VALUES ('employeesid1', 'employeesname1','employees1.png', 'employeetroeid1')",
"CREATE TABLE feedback (phone TEXT ,email TEXT, comment TEXT, employees_id TEXT ,store_id TEXT, rating TEXT)",
"INSERT INTO feedback (phone, email, comment, employees_id, store_id, rating) VALUES ('phone1','email1','comment1', 'employeesid1' ,'storeid1' ,'33')"
]

import sqlite3
conn = sqlite3.connect('database.db')
for each in a:
    records = conn.execute(each)
conn.commit()