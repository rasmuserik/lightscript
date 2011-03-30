require.paths.push("./mui/js");
require("xmodule").def("muiSampleMain",function(){


// bind the main function
require("mui").setMain(main);

function main(mui) {
    // sample ui-page
    mui.showPage(["page", 
        ["text", "hello world"]]);
}


function search(mui) {
    // indicat that we are loading something
    mui.loading();

    // jsonp callback
    mui.callJsonpWebservice("http://opensearch.addi.dk/1.0/", "callback", {
        action: "search",
        query: mui.form.query,
        source: "bibliotekdk",
        start: "1",
        stepvalue: "1",
        outputType: "json"}, function(result) {
            mui.showPage(["page", 
                ["text", "Number of hits: ", result.searchResponse.result.hitCount.$],
                ["button", {"fn": main}, "back to start"]
                ]);
        });
}

});
