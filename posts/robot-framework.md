#### 前言



#### 关键节点

robot中**prerunmodifier**的加入减少重复引入，让代码框架更轻量清晰，resource一次加载。





#### 历史问题

为了模块化，复杂的项目会定义分类出颗粒度不同的前置条件或者全局变量，以供不同的用例运行前作为suite setup来调用。而robotframework项目在执行每一个robot文件时，都是从setting开始，引入resource文件，执行suite setup，再然后执行testcase等。那么有两种情况会重复执行setup，如果setup中定义一下公共变量耗时比较长时，那么重复执行setup将大大加长了全量用例的执行时间。（注：robot文件的suit setup中执行定义的变量只作用于本robot用例范围）

1. test cases分开文件了，这个你无法避免，因为你总不能一个robot文件，写上上千条用例吧，那么对于公共变量，每多加一个robot，这块的执行就是冗余的。
2. resource文件颗粒度较大导致每个robot都调用，也是直接冗余+冗余了。



```robot
# case.robot
*** Settings ***
Resource    初始化.robot
Resource        防火墙初始化.robot
Suite Setup     初始化应用识别环境

*** Variables ***
${参数1}      test文件.json
${参数2}    cat /proc/net/nf_conntrack; conntrack -D; 

*** Test Cases ***
用例1
    [Tags]      标签
 	...
 
用例2
    [Tags]      标签
    ...
```

其中初始化.robot文件中定义有keyword（初始化应用识别环境）

 ```robot
 # 初始化.robot
 *** Variable ***
 ${自动化脚本目录}       /data/
 
 *** Keywords ***
 初始化应用识别环境
     ...这里有很多，耗时比较长
 ```

那么在项目进行下去的时候，如case.robot的用例文件多了起来之后，耗时就慢慢变得很长很长。



#### 核心逻辑

```python
# SuiteVisitor.py  项目目录下创建
"""
                    
参考材料：https://robot-framework.readthedocs.io/en/latest/_modules/robot/model/visitor.html  #  prerunmodifier 标准文件
         https://robot-framework.readthedocs.io/en/latest/autodoc/robot.running.html      # TestSuiteBuilder 基于现有测试用例文件和目录创建可执行测试套件
"""
from robot.api import TestSuiteBuilder
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
init_robot_path = '配置初始化.robot'
# 重写套件
class SuiteVisitor:
    """Abstract class to ease traversing through the suite structure.
                    
    See the :mod:`module level <robot.model.visitor>` documentation for more
    information and an example.
    """
    def visit_suite(self, suite):
        """Implements traversing through suites.
                    
        Can be overridden to allow modifying the passed in ``suite`` without
        calling :meth:`start_suite` or :meth:`end_suite` nor visiting child
        suites, tests or setup and teardown at all.
        ljy: --prerunmodifier 调用的方法。
        """
        if self.start_suite(suite) is not False:
            try:
                suite.setup.visit(self)
                suite.suites.visit(self)
                suite.tests.visit(self)
                suite.teardown.visit(self)
                self.end_suite(suite)
            except Exception as e:
                pass
    def start_suite(self, suite):
        """Called when a suite starts. Default implementation does nothing.
                    
        Can return explicit ``False`` to stop visiting.
        ljy: 套件开始执行的时候，将目标robot文件处理成可执行套件，并加载到原套件的最前端。
        """
        # # print(dir(suite))
        # print(suite.suites)
        # print(dir(suite.suites))
        # # print(suite._setter__suites)
        # # print(suite.filter)
        # # print(suite.configure)
        # # print(suite.parent)
        # print("edit_suite")
        su = TestSuiteBuilder().build(init_robot_path)
        suite.suites.insert(0, su)
        print(suite.suites)
```

```robot
# 配置初始化.robot

*** Settings ***
Resource            common.robot



*** Variables ***

...定义了很多全局变量


*** Keywords ***
...定义了很多全局关键字

```

