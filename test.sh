mkdir blah; for x in *.js; do echo $x; node test.js $x > blah/$x; done; cp trycatch.js blah; cd blah; node test.js test.js; cd ..
