[TOC]

本文研究web逆向技术。欢迎来交流。

我们尝试做一下 fanyi.baidu.com的爬虫来理解逆向是什么东西。

### 技巧总结

先写在前面哈。

1. copy link as bash curl ，然后转化下成python代码，快速在python中执行。
2. debug时可以尝试全局搜索或者基于XHR进行断点处理，利用好call stack栈。
3. 在报错的地方断点，断住之后，使用控制台输出变量的值或调用函数查看返回值。
4. 断点住之后，悬停在函数上可以看到定义函数的位置。

### 分析请求

#### 分析请求体变化

我们打开网页：fanyi.bidu.com 进行好几次查询。观察下接口和请求体的数据结构。

我们可以看到token值是不变的，而且这个页面也不需要登录就可以访问。那么我们尝试下直接复用token值；

而sign值是变化的，我们猜测它是根据需要查询的内容，在某种规则处理生成的。故这个值需要我们动态生成。

<img src="./md_img/web-reverse-01.png" style="zoom:20%;" >

#### 脚本运行代码并试用

​    上边的步骤，已经帮助我们猜测参数sign值是动态的了。然后我们如何进一步确认呢？ 我们将请求处理下，放到python下执行下看看。

- 首先copy link as bash curl

<img src="./md_img/fanyi-baidu-copyasbashcurl.png" style="zoom:25%;" />



- 然后使用工具网站转换一下（https://curlconverter.com/）

  <img src="./md_img/curl2script.png" style="zoom:25%" />

  <img src="./md_img/curl2script2.png" style="zoom:25%;" />

- 创建一个PY脚本，运行一下
  
  <img src="./md_img/curl2script3.png" style="zoom:25%;" />
  
- 接下来我们试试，查询下其他内容，看下能不能正常调用。结果发现报错了。
  
  <img src="./md_img/url-error.png" style="zoom:25%;" />
  
- 好像再次确认了sign值应该是变化的了？那么我们回到网页上找下sign的值是怎么生成的。
  
  

### 开始逆向

#### 全局搜索

试试用chrome dev tools 的全局搜索看看能不能搜索出啥东西。

<img src="./md_img/allSearch.png" style="zoom:25%;" />

我看了下，三个对象方法，变量名或文本组成字符，没啥意义。但是有一个getAcsSign对象，是一个匿名函数返回的一个s变量。试试打个断点看看是不是它。很可惜，不是它。

<img src="./md_img/fanyi-baidu-break1.png" style="zoom:25%;" />

#### 逆向查找业务逻辑

尝试从请求出发，进行逆向向上进行排查吧

debug下业务uri：/v2transapi?from=zh&to=en

<img src="./md_img/fanyi-baidu-break2.png" style="zoom:25%;" />

第一步，我们找到了send方法，认为是发送请求的动作

<img src="./md_img/fanyi-baidu-debug1.png" style="zoom:25%;" />

<img src="./md_img/fanyi-baidu-debug2.png" style="zoom:25%;" />

第二步，我们看看这个直到这个send函数的调用栈。

[Call stack（调用栈） - MDN Web 文档术语表：Web 相关术语的定义 | MDN (mozilla.org)](https://developer.mozilla.org/zh-CN/docs/Glossary/Call_stack)

我们通过调用栈，回溯下函数调用过程

<img src="./md_img/fanyi-baidu-debug3.png" style="zoom:25%;" />

然后我们在最后一个匿名函数中（anonymous）找到有ajax请求的具体信息。

<img src="./md_img/fanyi-baidu-debug4.png" style="zoom:25%;" />

尝试下找找w变量

<img src="./md_img/fanyi-baidu-debug5.png" style="zoom:25%;" />

找到w变量后，我们看到sign值是一个b函数的返回值。b函数的入参是查询内容。

<img src="./md_img/fanyi-baidu-debug6.png" style="zoom:25%;" />

我们再找找这个b函数。

<img src="./md_img/fanyi-baidu-signFun1.png" style="zoom:25%;" />

拿到这个b函数之后，我们复制到本地新增一个js文件（script.js），然后试着执行一下。

<img src="./md_img/fanyi-baidu-signFun2.png" style="zoom:25%;" />

调用下函数后执行，我们发现第一个报错是，r变量没有定义。

<img src="./md_img/fanyi-baidu-signFun3.png" style="zoom:25%;" />

找到for函数，我们回到网页上断点看看。

<img src="./md_img/fanyi-baidu-signFun4.png" style="zoom:25%;" />

找到r变量。那我们复制它的值，在js上定义const，然后再执行看看看，然后发现n函数为定义。

<img src="./md_img/fanyi-baidu-signFun5.png" style="zoom:25%;" />

​	同上，我们回到网页，看看n函数的定义。

<img src="./md_img/fanyi-baidu-signFun6.png" style="zoom:25%;" />
	
	找到n函数之后，我们复制到js文件中，然后再运行下，可以正常运行了，输出的值跟之前debug在网页控制台输出的值是一样的了。

<img src="./md_img/fanyi-baidu-signFun7.png" style="zoom:25%;" />

### 完成业务代码

到了这里就好办了。我们将代码逻辑梳理下，实现一下。

1. 将请求体中的sign变量化，由执行js语句处理生成
2. 将query的值变量话，支持自定义
3. 将响应体整理下，只要目的内容
4. 做个while True循环，优化下日志，提供持续可用

```python
#! /usr/bin/python3
# -*- coding: utf-8 -*-
# @Time : 2023/3/28 22:53
# @Author :"Liu Jin Yao"
# @Email : 592203122@qq.com
# @File : main.py

# 本文主要逆向fanyi.baidu.com来实现爬虫翻译。
import requests
import execjs

...
def get_sign(string):
    with open("script.js", "r", encoding="utf8") as file:
        js = file.read()
        functions = execjs.compile(js)
        result = functions.call("singn", string)  # 回调函数
        return result


def fanyiMain(query_str):
    sign = get_sign(query_str)
    data['query'] = query_str
    data['sign'] = sign
    response = requests.post('https://fanyi.baidu.com/v2transapi', params=params, cookies=cookies, headers=headers, data=data)
    try:
        result = response.json()['trans_result']['data'][0]["dst"]
        return result
    except:
        print(response.json())
        return "sorry i have some error"


if __name__ == '__main__':
    while True:
        query = input("请输入翻译的中文: ")
        result = fanyiMain(query)
        print(f"翻译结果为:{result}")
```

打完收工

<img src="./md_img/fanyi-baidu-result.png" style="zoom:25%;" />