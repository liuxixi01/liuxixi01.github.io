git status 
git add .
git commit --no-verify -m "add files"
sleep 1
git push origin main
sleep 1
git subtree push --prefix dist origin gh-pages