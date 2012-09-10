rm -rf result
mkdir result
for x in *.js
do
    node ../pp $x > result/$x
    diff expected/$x result/$x
done

