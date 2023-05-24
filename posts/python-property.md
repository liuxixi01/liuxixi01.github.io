[TOC]

### 写在前面

本文主要是想讲下property这个类装饰器的使用方法，还有如果在伪生产的业务上为什么要用这个东西。

### 基础知识

1. property本身为一个类方法，通过传入的get/set/del/doc方法， 构造返回一个property对象。
   <img src="D:\code\morebooks\posts\md_img\python-property-args.png" style="zoom:38%;" />
2. property是被设计出来补充对象保护（只读）属性的可靠性，是魔术方法的一类
3. 如果在类装饰器上使用，需要注意：**get/set/del的三个函数的函数名是一样的，都指向到被调用对象（被@property装饰的对象）**。
4. set/del方法的装饰，是**调用对象的setter和deleter的方法**进行装饰。

### 示例

1.  最常规可用方法
       <br>      基本逻辑是，定义好get/set/del等几个方式方法，然后**构造出property对象赋给一个类属性**，自此，**调用类属性触发get方法；赋值类属性触发set方法；删除类属性触发del方法**。

   ```python
   class B:
       def __init__(self):
           self._source = 90
       def get_source(self):
           return self._source
       def set_source(self, *args, **kwargs):
           print("set val is", *args, **kwargs)
           self._source = 85
           print("set source ok")
       def del_source(self):
           print("i m over")
       # 给my_source挂载get、set、del下的方式方法
       my_source = property(get_source, set_source, del_source, "我是获取分数的方式方法")
       print(type(my_source))   # <class 'property'> 
   if __name__ == '__main__':
       b = B()
       # 查、改、删
       print(b.my_source)  # 90
       b.my_source = 80  # set val is 80   set source ok
       del b.my_source   # i m over
       b.__delattr__("my_source")  # i m over
   ```

2. 类装饰器方法的引用（伪业务）

   ​    <br>基本逻辑是： 在这个操作业务对象中定义有金额的属性，将其修饰成property属性。然后在查询时（如now_money = obj.bank_money）、在赋值时（如obj.bank_money = 3）、在删除时（如del obj.bank_money），**使用这些Python基本操作时都可以被加入业务逻辑的验证**；以此来达到保护的的目的。

   ```python
   #! /usr/bin/python3
   # -*- coding: utf-8 -*-
   # @Time : 2023/5/7 12:20
   # @Author :"Liu Jin Yao"
   # @Email : 592203122@qq.com
   # @File : debug.py
   
   """
   本文探讨实现类保护属性的使用
   事件：查钱、取钱、销户都是需要不同的操作密码, 只有在输入正确的对应的操作密码下才可以操作
   """
   class A:
       def __init__(self, name='liusan'):
           self.money = 0
   
       # 修饰出调用对象
       @property
       def bank_money(self):
           """
               定义属性，装饰为get方式方法; 同时doc文档也是我。
           :return:
           """
           pwd = input("u need input the read password:")
           if 'r' == pwd.strip(" "):
               print("get money success!")
               return self.money
           else:
               print("sorry, u can not edit the money!")
           return None
   
       @bank_money.setter
       def bank_money(self, newmoney):
           """
               挂载set方法；定义set逻辑，被装饰为属性的set方式方法。 被复制时触发，并将赋的值做为参数传入
           :param newmoney:
           """
           pwd = input("u need input the edit password:")
           if 'w' == pwd.strip(" "):
               print("set money success!")
               self.money = newmoney
           else:
               print("sorry, u can not edit the money!")
   
       @bank_money.deleter
       def bank_money(self):
           """
               挂载del方法；定义del逻辑，被装饰为属性的del方式方法  被del时触发
           :param newmoney:
           """
           pwd = input("u need input the del password:")
           if 'd' == pwd.strip(" "):
               print("del money success!")
               self.money = None
           else:
               print("sorry, u can not del the money!")
   
       @property
       def zz(self):
           return self.bank_money
   
   if __name__ == '__main__':
       obj = A()
       #  基础调用时触发获取金额的验证逻辑
       now_money = obj.bank_money
       print('a1:', now_money)
   
       #  赋值时触发修改金额的验证逻辑
       obj.bank_money = 3
       print('a2:', obj.bank_money)
   
       # 触发销户的验证逻辑
       del obj.bank_money
       print('a3:', obj.bank_money)
   
       # u need input the read password:r
       # get money success!
       # a1: 0
       # u need input the edit password:w
       # set money success!
       # u need input the read password:r
       # get money success!
       # a2: 3
       # u need input the del password:d
       # del money success!
       # u need input the read password:r
       # get money success!
       # a3: None 
   ```

   ​      而基于私有、保护的理解，从这里，我理解的是**支持你做逻辑从基础操作中也能保护自己**；私有就理解为私有于类的属性了。

   当然，如果**property对象没有设置set方法**的话，那么如果该对象被赋值（如obj.bank_money = 20）则会触发property 'bank_money' of 'A' object has no setter的异常，从而达到只读不可修改的目录。

   ​    总体上看，如果是基于保护触发，在业务需要直接调用查询、修改、删除的逻辑函数，也是也可以基本达到目的的。不过这种做法就**无法规避exec()或eval()的注入**。

   <img src="D:\code\morebooks\posts\md_img\python-property-attack.png" style="zoom:25%;" />

   

3. 不在类对象里直接引用
   

   ```python
   AGE = 20
   def get_age():
       return AGE
   def set_age(age):
       print("set val is", age)
       AGE = age
       print("set age ok")
   def del_age():
       print("i m over")
   MY_AGE = property(get_age, set_age, del_age, "我的我的")
   
   if __name__ == '__main__':
       print(MY_AGE)   # <property object >
       print(MY_AGE.fget())  # 查询直接调用fget
       MY_AGE.fset(40)     # 赋值直接调用fset
       print(MY_AGE.fget())
       MY_AGE.fdel()   # 删除直接调用fdel
       print(MY_AGE.__doc__)  # 我的我的
   ```

   ​      如果property方法不在对象里用的话，其实也是不符合设计初衷的，单纯只是引用了一个类方法去构造了另一个对象，然后通过调用这个新对象的一些方法达到业务目的，仅此而已。在这里写上这个是为了帮助理解：你可以认为**解释器在工作时，识别为property object时，调用时则运行fget、赋值时就调用该对象的fset、删除时则调用fdel。** 那么基于这样的逻辑，希望可以在日后的代码设计上可以更加pythonic

### property的应用点及其关键的地方

如上：

1. 使用property可以让你在取值、赋值、删除这些Python基本操作时都可以被加入业务逻辑的验证
2. property对象没有设置set方法的时候，赋值就会触发异常，从而达到只读属性。
3. property是被设计出来补充对象保护（只读）属性的可靠性
4. more...