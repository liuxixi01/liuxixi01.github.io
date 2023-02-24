#!  /usr/bin/bash
# 先 npm run build 后，一次性提交文件。
git status 
git add .
git commit --no-verify -m "add files"
sleep 1
git push origin main
sleep 1
git subtree push --prefix dist origin gh-pages