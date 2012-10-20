solsort_define("combigame",function(exports, require){(function() {
    // outer: parseInt
    // outer: item
    // outer: webutil
    // outer: _
    // outer: fullbrows
    // outer: localStorage
    // outer: JSON
    // outer: delete
    // outer: Date
    // outer: setTimeout
    // outer: false
    // outer: Math
    // outer: true
    // outer: $
    // outer: exports
    var menu;
    var startGame;
    var okDeck;
    var hint;
    var okSet;
    var rnd3;
    var randomCard;
    var testSelected;
    var partialScore;
    var showScore;
    var log;
    var curDate;
    var logData;
    var reshuffle;
    var click;
    var anim;
    var doLayout;
    var cardPositions;
    var unselectedStyle;
    var selectedStyle;
    var visibleStyle;
    var transitionStyle;
    var hidden;
    // outer: Array
    var cards;
    // outer: Object
    var selected;
    var giveup;
    // outer: undefined
    var prevtime;
    // ## Dependencies
    /*global localStorage: true*/
    //var webutil = require('webutil');
    //var fullbrows = require('fullbrows');
    //
    //
    // ## Game state
    prevtime = undefined;
    giveup = undefined;
    selected = {};
    cards = [];
    //
    // ## Styles
    hidden = {
        opacity : 0,
        width : 0,
        height : 0,
    };
    //
    transitionStyle = {
        transition : "opacity 1s",
        "-moz-transition" : "opacity 1s",
        "-webkit-transition" : "opacity 1s",
        "-o-transition" : "opacity 1s",
    };
    //
    visibleStyle = undefined;
    selectedStyle = undefined;
    unselectedStyle = undefined;
    cardPositions = undefined;
    // ## Layout
    doLayout = function() {
        // outer: cards
        // outer: anim
        // outer: unselectedStyle
        // outer: selectedStyle
        // outer: visibleStyle
        // outer: Object
        var i;
        // outer: false
        var leftPad;
        var topPad;
        // outer: Math
        var size;
        // outer: Array
        // outer: cardPositions
        // outer: true
        var landscape;
        var h;
        var w;
        // outer: $
        var $content;
        $content = $("#content");
        $content.css("background", "white");
        w = $content.width();
        h = $content.height();
        landscape = true;
        cardPositions = [];
        size = Math.min(Math.max(w, h) / 4, Math.min(w, h) / 3);
        //*0.85;
        if(w > h) {
            topPad = h - size * 3 >> 1;
            leftPad = w - size * 4 >> 1;
        } else  {
            topPad = h - size * 4 >> 1;
            leftPad = w - size * 3 >> 1;
            landscape = false;
        };
        topPad += 0;
        //0.05*size;
        leftPad += 0;
        //0.05*size;
        i = 0;
        while(i < 12) {
            if(landscape) {
                cardPositions.push({top : topPad + (0.5 + i % 3) * size, left : leftPad + (0.5 + (i / 3 | 0)) * size});
            } else  {
                cardPositions.push({left : leftPad + (0.5 + i % 3) * size, top : topPad + (0.5 + (i / 3 | 0)) * size});
            };
            ++i;
        };
        visibleStyle = {
            opacity : 1,
            "margin-top" : - size / 2,
            "margin-left" : - size / 2,
            background : "none",
            width : 0.9 * size,
            height : 0.9 * size,
        };
        selectedStyle = {
            "border-style" : "solid",
            "border-width" : 1,
            "margin-top" : - size / 2 - 1,
            "margin-left" : - size / 2 - 1,
            "border-radius" : size / 16,
            "border-color" : "gray",
        };
        unselectedStyle = {
            "margin-top" : - size / 2,
            "margin-left" : - size / 2,
            border : "none",
        };
        //
        $(".card").css({top : h, left : w});
        i = 0;
        while(i < 12) {
            anim(i, $("#card" + cards[i]))();
            ++i;
        };
    };
    // ### Animate that a card fades in
    anim = function(i, $card) {
        // outer: visibleStyle
        // outer: transitionStyle
        // outer: setTimeout
        // outer: cardPositions
        return function() {
            // outer: visibleStyle
            // outer: transitionStyle
            // outer: setTimeout
            // outer: i
            // outer: cardPositions
            // outer: $card
            $card.css(cardPositions[i]);
            setTimeout(function() {
                // outer: visibleStyle
                // outer: transitionStyle
                // outer: $card
                $card.css(transitionStyle).css(visibleStyle);
            }, 0);
        };
    };
    //
    // ## Handle clicking on cards
    click = (function() {
        // outer: testSelected
        // outer: true
        // outer: selectedStyle
        // outer: delete
        // outer: unselectedStyle
        // outer: $
        // outer: selected
        // outer: undefined
        // outer: Date
        var prevCard;
        var lastClickTime;
        // private variables, to make sure we only click once, even if the browser sends several events.
        lastClickTime = 0;
        prevCard = "";
        return function(card) {
            // outer: testSelected
            // outer: true
            // outer: selectedStyle
            // outer: delete
            // outer: unselectedStyle
            // outer: $
            // outer: selected
            // outer: undefined
            // outer: lastClickTime
            // outer: Date
            // outer: prevCard
            if(card === prevCard && Date.now() - lastClickTime < 100) {
                return undefined;
            };
            prevCard = card;
            lastClickTime = Date.now();
            // swap whether the card is selected
            if(selected[card]) {
                $("#card" + card).css(unselectedStyle);
                delete(selected[card]);
            } else  {
                $("#card" + card).css(selectedStyle);
                selected[card] = true;
            };
            // test if selected cards makes a valid combination
            testSelected();
        };
    })();
    //
    // ## Shuffle cards until a valid combination
    // reshuffle 10 times, and take the worst/best combination if hard/easy
    reshuffle = function(shuffleFn) {
        // outer: okDeck
        var i;
        var score;
        // shuffle until we have a valid combination. (score=0 => no valid set)
        score = 0;
        i = 0;
        while(!score && i < 1000) {
            shuffleFn();
            score = okDeck();
            ++i;
        };
    };
    // ## Keep track of score
    logData = undefined;
    curDate = undefined;
    log = function(obj) {
        // outer: Array
        // outer: localStorage
        // outer: JSON
        // outer: setTimeout
        setTimeout(function() {
            // outer: Array
            // outer: localStorage
            // outer: JSON
            var logData;
            var curDate;
            // outer: obj
            var objDate;
            objDate = obj.now / 24 / 60 / 60 / 1000 | 0;
            if(objDate !== curDate) {
                curDate = objDate;
                logData = JSON.parse(localStorage.getItem("combigamelog" + curDate) || "[]");
            };
            logData = logData || [];
            logData.push(obj);
            localStorage.setItem("combigamelog" + curDate, JSON.stringify(logData));
        }, 0);
    };
    // ## Score reporting
    showScore = function() {
        // outer: Date
        // outer: exports
        // outer: webutil
        // outer: partialScore
        // outer: logData
        // outer: _
        // outer: $
        // outer: true
        // outer: Object
        // outer: fullbrows
        fullbrows.start({hideButtons : true, update : function() {
            // outer: Date
            // outer: exports
            // outer: fullbrows
            // outer: webutil
            // outer: Object
            // outer: partialScore
            // outer: logData
            // outer: _
            var log;
            // outer: $
            var $t;
            $t = $("<div>");
            log = _(logData).filter(function(elem) {
                return !elem.hint;
            }).sort(function(a, b) {
                return a.time - b.time;
            });
            $t.append($("<h3>Timingsxa0</h3>"));
            if(log.length === 0) {
                $t.append("<p>No score available, please play the game before looking at the timings.</p>");
            };
            partialScore($t, "Today", log);
            partialScore($t, "Last five minutes", log.filter(function(elem) {
                // outer: Date
                return Date.now() - elem.now < 5 * 60 * 1000;
            }));
            partialScore($t, "Last minute", log.filter(function(elem) {
                // outer: Date
                return Date.now() - elem.now < 60 * 1000;
            }));
            $t.append("<p>Click to close.</p>");
            $("#content").html("").append($t);
            $t.css({width : "80%", height : "90%"});
            webutil.scaleText($t);
            $t.css({margin : "3% 10% 7% 10%", overflow : "visible"});
            $t.bind("mousedown touchstart", fullbrows.startFn(exports.app));
        }});
    };
    partialScore = function($t, title, log) {
        // outer: $
        if(log.length > 0) {
            if(title) {
                $t.append($("<div><b>" + title + "</b></div>"));
            };
            $t.append($("<div>Best time: " + (log[0].time / 10 | 0) / 100 + "s"));
            $t.append($("<div>Median time: " + (log[log.length >> 1].time / 10 | 0) / 100 + "s"));
        };
    };
    // ## Check whether the selected figures yields a valid combination
    testSelected = function() {
        // outer: randomCard
        // outer: doLayout
        // outer: reshuffle
        // outer: _
        // outer: Array
        // outer: unselectedStyle
        // outer: $
        // outer: setTimeout
        // outer: false
        // outer: cards
        // outer: giveup
        // outer: prevtime
        // outer: log
        // outer: Date
        var now;
        // outer: okSet
        // outer: undefined
        // outer: selected
        // outer: Object
        var list;
        list = Object.keys(selected);
        // 3 not selected yet, break
        if(list.length < 3) {
            return undefined;
        };
        if(okSet(list[0], list[1], list[2])) {
            // valid combination, log to score
            now = Date.now();
            log({
                time : now - prevtime,
                hint : giveup,
                cards : cards.slice(0),
                choosen : list,
                now : now,
            });
            giveup = false;
            prevtime = now;
            // fade-out the cards
            setTimeout(function() {
                // outer: $
                // outer: list
                list.forEach(function(id) {
                    // outer: $
                    $("#card" + id).css("opacity", 0);
                });
            }, 0);
            // reshuffle, and bring in 3 new cards
            setTimeout(function() {
                // outer: randomCard
                // outer: doLayout
                // outer: reshuffle
                // outer: list
                // outer: cards
                // outer: _
                // outer: Array
                var ids;
                // outer: unselectedStyle
                // outer: $
                $(".card").css(unselectedStyle);
                ids = [
                    _(cards).indexOf(list[0]),
                    _(cards).indexOf(list[1]),
                    _(cards).indexOf(list[2]),
                ];
                reshuffle(function() {
                    // outer: randomCard
                    // outer: ids
                    // outer: cards
                    var i;
                    i = 0;
                    while(i < 3) {
                        cards[ids[i]] = randomCard();
                        ++i;
                    };
                });
                doLayout();
            }, 1000);
            // invalid combination clear selection
        } else  {
            $(".card").css(unselectedStyle);
        };
        selected = {};
    };
    // ## Random card id
    randomCard = function() {
        // outer: rnd3
        return "" + rnd3() + rnd3() + rnd3() + rnd3();
    };
    // ### Randomly 0, 1, or 2
    rnd3 = function() {
        // outer: Math
        return Math.random() * 3 | 0;
    };
    // ## return true if the three card-ids forms a valid combination
    okSet = function(a, b, c) {
        // outer: true
        // outer: false
        var ok;
        var i;
        i = 0;
        while(i < 4) {
            ok = a[i] === b[i] && b[i] === c[i] || (a[i] !== b[i] && b[i] !== c[i] && c[i] !== a[i]);
            if(!ok) {
                return false;
            };
            ++i;
        };
        return true;
    };
    // ## show where there is a valid set
    hint = function() {
        // outer: undefined
        // outer: true
        // outer: giveup
        // outer: selectedStyle
        // outer: cards
        // outer: okSet
        var c;
        var b;
        var a;
        // outer: unselectedStyle
        // outer: $
        // outer: Object
        // outer: selected
        selected = {};
        $(".card").css(unselectedStyle);
        a = 0;
        while(a < 10) {
            b = a + 1;
            while(b < 11) {
                c = b + 1;
                while(c < 12) {
                    if(okSet(cards[a], cards[b], cards[c])) {
                        $("#card" + cards[a]).css(selectedStyle).css({
                            opacity : 0.6,
                            background : "#ccc",
                            border : "1px solid #bbb",
                        });
                        $("#card" + cards[b]).css(selectedStyle).css({
                            opacity : 0.6,
                            background : "#ccc",
                            border : "1px solid #bbb",
                        });
                        $("#card" + cards[c]).css(selectedStyle).css({
                            opacity : 0.6,
                            background : "#ccc",
                            border : "1px solid #bbb",
                        });
                        giveup = true;
                        return undefined;
                    };
                    ++c;
                };
                ++b;
            };
            ++a;
        };
    };
    // ## The number of valid combinations among the 12 figures
    okDeck = function() {
        // outer: okSet
        var c;
        var b;
        var a;
        // outer: true
        // outer: false
        // outer: cards
        var i;
        var ok;
        // outer: Object
        var cardHash;
        cardHash = {};
        ok = 0;
        i = 0;
        while(i < 12) {
            if(cardHash[cards[i]]) {
                return false;
            };
            cardHash[cards[i]] = true;
            ++i;
        };
        a = 0;
        while(a < 10) {
            b = a + 1;
            while(b < 11) {
                c = b + 1;
                while(c < 12) {
                    if(okSet(cards[a], cards[b], cards[c])) {
                        ++ok;
                    };
                    ++c;
                };
                ++b;
            };
            ++a;
        };
        return ok;
    };
    // ## Initialisation function
    startGame = function() {
        // outer: randomCard
        // outer: Array
        // outer: true
        // outer: click
        // outer: doLayout
        // outer: reshuffle
        // outer: cards
        // outer: Object
        var l;
        var k;
        var j;
        var i;
        // outer: Date
        // outer: prevtime
        var $content;
        // outer: $
        // outer: false
        // outer: giveup
        giveup = false;
        $("body").append("<div id=\"content\"></div>");
        $content = $("#content");
        $content.html("");
        prevtime = Date.now();
        //require('combigameCards').createCards($('#content').width()/3|0);
        i = 0;
        while(i < 3) {
            j = 0;
            while(j < 3) {
                k = 0;
                while(k < 3) {
                    l = 0;
                    while(l < 3) {
                        $content.append($("<img class=\"card\" src=\"imgs/combigame" + i + j + k + l + ".png\" id=\"card" + i + j + k + l + "\">"));
                        ++l;
                    };
                    ++k;
                };
                ++j;
            };
            ++i;
        };
        $(".card").css({position : "absolute", opacity : "0"});
        $(".card").bind("touchstart mousedown", function(e) {
            // outer: true
            // outer: click
            click(e.target.id.slice(4));
            e.preventDefault();
            return true;
        });
        cards;
        reshuffle(function() {
            // outer: randomCard
            // outer: i
            // outer: Array
            // outer: cards
            cards = [];
            i = 0;
            while(i < 12) {
                cards.push(randomCard());
                ++i;
            };
        });
        doLayout();
    };
    // # Utility for showing a menu
    menu = function(items) {
        // outer: parseInt
        // outer: webutil
        // outer: $
        // outer: Math
        // outer: item
        // outer: true
        // outer: Object
        // outer: fullbrows
        fullbrows.start({hideButtons : true, update : function() {
            // outer: parseInt
            // outer: webutil
            // outer: items
            // outer: Object
            var $content;
            var $menu;
            // outer: $
            // outer: Math
            var s;
            // outer: item
            item;
            s = Math.min($("#content").height() + $("#content").width());
            $menu = $("<div>");
            $content = $("#content");
            $content.html("").append($menu);
            Object.keys(items).forEach(function(item) {
                // outer: items
                // outer: s
                // outer: Object
                // outer: $
                // outer: $menu
                $menu.append($("<div>").text(item).css({
                    border : "1px solid black",
                    "border-radius" : s * 0.02,
                    "text-align" : "center",
                    margin : s * 0.01,
                    padding : s * 0.01,
                }).bind("click", items[item]));
            });
            webutil.scaleText($content);
            $content.css("font-size", parseInt($content.css("font-size"), 10) * 0.8);
            $menu.css("top", ($content.height() - $menu.height()) / 2);
            $menu.css("position", "absolute");
            $menu.css("width", "100%");
        }});
    };
    // ## App definition
    exports.app = {start : startGame, update : doLayout};
})();
});