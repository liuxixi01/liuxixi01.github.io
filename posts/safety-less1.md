### SQL注入

```text
自行探索sql注入的逻辑，以sqlite3为数据库为例
```

### Python写一个后台服务

```python
#! /usr/bin/python3
# -*- coding: utf-8 -*-
# @Time : 2023/2/24 10:50
# @Author :"Liu Jin Yao"
# @Email : 592203122@qq.com
# @File : Application.py

from flask import Flask
import sqlite3


class sqliteDatabase:
    def __init__(self):
        self.connect = sqlite3.connect("server.sqlite3")
        self.cursor = self.connect.cursor()
	
    # 建表
    def newTable(self, tableName, keyList:list):
        key = ", ".join(keyList)
        sql = f"create table {tableName} ({key})"
        self.cursor.execute(sql)
        self.connect.commit()
        return True

    # 查询
    def queryAll(self, sql):
        self.cursor.execute(sql)
        return self.cursor.fetchall()

    def __del__(self):
        self.cursor.close()
        self.connect.close()

    def setup1(self):
        self.newTable(tableName="addr",
                                  keyList=['id INTEGER PRIMARY KEY autoincrement', "name varchar(15) not null"])
        self.newTable(tableName="user",
                                  keyList=['id INTEGER PRIMARY KEY autoincrement', "name varchar(15) not null"])


app = Flask(__name__)

@app.route("/showUser/<name>", methods=["GET"])
def index(name):
    sql = f"select * from user where name = \"{name}\" limit 0, 1"
    result = sqliteDatabase().queryAll(sql)
    print(result)
    return {"success": True, "result": result}


if __name__ == '__main__':
    # sqliteDatabase().setup1()
    app.run("0.0.0.0", 3111, debug=True)

```

