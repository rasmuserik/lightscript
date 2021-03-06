(function() {
    // ## Dependencies
    /*global localStorage: true*/
    //var webutil = require('webutil');
    //var fullbrows = require('fullbrows');
    //
    //
    // ## Game state
    var prevtime = undefined;
    var giveup = undefined;
    var selected = {};
    var cards = [];
    //
    // ## Styles
    var hidden = {
        opacity : 0,
        width : 0,
        height : 0,
    };
    //
    var transitionStyle = {
        transition : "opacity 1s",
        "-moz-transition" : "opacity 1s",
        "-webkit-transition" : "opacity 1s",
        "-o-transition" : "opacity 1s",
    };
    //
    var visibleStyle = undefined;
    var selectedStyle = undefined;
    var unselectedStyle = undefined;
    var cardPositions = undefined;
    // ## Layout
    var doLayout = function() {
        var $content = $("#content");
        $content.css("background", "white");
        var w = $content.width();
        var h = $content.height();
        var landscape = true;
        cardPositions = [];
        var size = Math.min(Math.max(w, h) / 4, Math.min(w, h) / 3);
        //*0.85;
        if(w > h) {
            var topPad = h - size * 3 >> 1;
            var leftPad = w - size * 4 >> 1;
        } else  {
            topPad = h - size * 4 >> 1;
            leftPad = w - size * 3 >> 1;
            landscape = false;
        };
        topPad += 0;
        //0.05*size;
        leftPad += 0;
        //0.05*size;
        var i = 0;
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
    var anim = function(i, $card) {
        return function() {
            $card.css(cardPositions[i]);
            setTimeout(function() {
                $card.css(transitionStyle).css(visibleStyle);
            }, 0);
        };
    };
    //
    // ## Handle clicking on cards
    var click = (function() {
        // private variables, to make sure we only click once, even if the browser sends several events.
        var lastClickTime = 0;
        var prevCard = "";
        return function(card) {
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
    var reshuffle = function(shuffleFn) {
        // shuffle until we have a valid combination. (score=0 => no valid set)
        var score = 0;
        var i = 0;
        while(!score && i < 1000) {
            shuffleFn();
            score = okDeck();
            ++i;
        };
    };
    // ## Keep track of score
    var logData = undefined;
    var curDate = undefined;
    var log = function(obj) {
        setTimeout(function() {
            var objDate = obj.now / 24 / 60 / 60 / 1000 | 0;
            if(objDate !== curDate) {
                var curDate = objDate;
                var logData = JSON.parse(localStorage.getItem("combigamelog" + curDate) || "[]");
            };
            logData = logData || [];
            logData.push(obj);
            localStorage.setItem("combigamelog" + curDate, JSON.stringify(logData));
        }, 0);
    };
    // ## Score reporting
    var showScore = function() {
        fullbrows.start({hideButtons : true, update : function() {
            var $t = $("<div>");
            var log = _(logData).filter(function(elem) {
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
                return Date.now() - elem.now < 5 * 60 * 1000;
            }));
            partialScore($t, "Last minute", log.filter(function(elem) {
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
    var partialScore = function($t, title, log) {
        if(log.length > 0) {
            if(title) {
                $t.append($("<div><b>" + title + "</b></div>"));
            };
            $t.append($("<div>Best time: " + (log[0].time / 10 | 0) / 100 + "s"));
            $t.append($("<div>Median time: " + (log[log.length >> 1].time / 10 | 0) / 100 + "s"));
        };
    };
    // ## Check whether the selected figures yields a valid combination
    var testSelected = function() {
        var list = Object.keys(selected);
        // 3 not selected yet, break
        if(list.length < 3) {
            return undefined;
        };
        if(okSet(list[0], list[1], list[2])) {
            // valid combination, log to score
            var now = Date.now();
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
                list.forEach(function(id) {
                    $("#card" + id).css("opacity", 0);
                });
            }, 0);
            // reshuffle, and bring in 3 new cards
            setTimeout(function() {
                $(".card").css(unselectedStyle);
                var ids = [
                    _(cards).indexOf(list[0]),
                    _(cards).indexOf(list[1]),
                    _(cards).indexOf(list[2]),
                ];
                reshuffle(function() {
                    var i = 0;
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
    var randomCard = function() {
        return "" + rnd3() + rnd3() + rnd3() + rnd3();
    };
    // ### Randomly 0, 1, or 2
    var rnd3 = function() {
        return Math.random() * 3 | 0;
    };
    // ## return true if the three card-ids forms a valid combination
    var okSet = function(a, b, c) {
        var i = 0;
        while(i < 4) {
            var ok = a[i] === b[i] && b[i] === c[i] || (a[i] !== b[i] && b[i] !== c[i] && c[i] !== a[i]);
            if(!ok) {
                return false;
            };
            ++i;
        };
        return true;
    };
    // ## show where there is a valid set
    var hint = function() {
        selected = {};
        $(".card").css(unselectedStyle);
        var a = 0;
        while(a < 10) {
            var b = a + 1;
            while(b < 11) {
                var c = b + 1;
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
    var okDeck = function() {
        var cardHash = {};
        var ok = 0;
        var i = 0;
        while(i < 12) {
            if(cardHash[cards[i]]) {
                return false;
            };
            cardHash[cards[i]] = true;
            ++i;
        };
        var a = 0;
        while(a < 10) {
            var b = a + 1;
            while(b < 11) {
                var c = b + 1;
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
    var startGame = function() {
        giveup = false;
        $("body").append("<div id=\"content\"></div>");
        var $content = $("#content");
        $content.html("");
        prevtime = Date.now();
        //require('combigameCards').createCards($('#content').width()/3|0);
        var i = 0;
        while(i < 3) {
            var j = 0;
            while(j < 3) {
                var k = 0;
                while(k < 3) {
                    var l = 0;
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
            click(e.target.id.slice(4));
            e.preventDefault();
            return true;
        });
        cards;
        reshuffle(function() {
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
    var menu = function(items) {
        fullbrows.start({hideButtons : true, update : function() {
            item;
            var s = Math.min($("#content").height() + $("#content").width());
            var $menu = $("<div>");
            var $content = $("#content");
            $content.html("").append($menu);
            Object.keys(items).forEach(function(item) {
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
