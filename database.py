import pymongo
from dateutil import parser
from dateutil.relativedelta import relativedelta
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

    def getgetStoreStats(self, data):
        mycol = self.mydb['rating']
        query = [
            { "$match" : { "id" : data.get('selectedQuestion'), 'storeId': data.get('storeId') } },
            {
                "$group": {
                "_id": {
                    "month": { "$month": "$created_at" },
                    "year": { "$year": "$created_at" }
                },
                "100": {"$sum": {"$cond": [{"$eq": ['$rating', 100]}, 1, 0]} },
                "66": {"$sum": {"$cond": [{"$eq": ['$rating', 66]}, 1, 0]} },
                "33": {"$sum": {"$cond": [{"$eq": ['$rating', 33]}, 1, 0]} },
                "count": { "$sum": 1 }
                }
            }
        ]
        rzlt = []
        for x in mycol.aggregate(query):
            rzlt.append(x)
        return rzlt
    
    def getAttandantStats(self, data):
        mycol = self.mydb['rating']
        dateTime = parser.parse(f"{data.get('year')}-{data.get('month')}-01T00:00:00.0Z")
        query = [
            {
                '$match': {
                    'storeId': data.get('storeId'), 
                    'type':'attandant',
                    'created_at' :{
                        '$gte': dateTime, 
                        '$lt': dateTime + relativedelta(months=1)
                    }
                }
            },
            {
                '$group':{
                    '_id':"$id",
                    'name' : { '$first': '$name' },
                    'file' : { '$first': '$file' },
                    '100': {"$sum": {"$cond": [{"$eq": ['$rating', 100]}, 1, 0]} },
                    '66': {"$sum": {"$cond": [{"$eq": ['$rating', 66]}, 1, 0]} },
                    '33': {"$sum": {"$cond": [{"$eq": ['$rating', 33]}, 1, 0]} },
                    'comment': {'$sum': {'$cond': [{'$ne': ['$comment', '']}, 1, 0]} },
                    'count': { "$sum": 1 }
                }
            }
        ]
        rzlt = []
        for x in mycol.aggregate(query):
            rzlt.append(x)
        return rzlt

    def deleteAttandant(self, col, data):
        mycol = self.mydb[col]
        _id = ObjectId(data.get("storeId", " "))
        query = {"$pull": { "attandants": {"id": data.get("attandantId", " ")} } }
        mycol.update_one({'_id': _id}, query)

    def updateAttandant(self, col, data):
        mycol = self.mydb[col]
        _id = ObjectId(data.get("storeId", " "))
        mycol.update_one({'_id': _id, "attandants.id": data.get("attandantId", " ")['id']}, { "$set": { "attandants.$" : data.get('attandantId') } })