import pymongo
from bson.objectid import ObjectId

class databaseclass():
    def __init__(self):
        self.client = pymongo.MongoClient("mongodb://localhost:27017/")
        self.mydb = self.client["wfeedback"]
    
    def find(self, col, query, projection = {}):
        mycol = self.mydb[col]
        if projection:
            data = mycol.find(query, projection)
        else:
            data = mycol.find(query)
        response = []
        for x in data:
            x['_id'] = str(x.get("_id",''))
            response.append(x)
        return response

    def update(self, col, id, data, push = False):
        mycol = self.mydb[col]
        _id = ObjectId(data.pop('_id'))
        newvalues = { "$set": data }
        if push == True:
            newvalues = { "$push": { "attandants": data } }
        mycol.update_one({'_id': _id}, newvalues)
        return data

    def insert(self, col, data):
        mycol = self.mydb[col]
        mycol.insert_one(data)
        return data

    def delete(self, col, id):
        mycol = self.mydb[col]
        mycol.delete_one({'_id':id})
        return 'done'


        






        