"use strict";
var params = URLSearchParams && new URLSearchParams(document.location.search.substring(1));
var zipuri = params && params.get("url");
console.log("zipuri:", zipuri);
// 1) get a promise of the content
var promise = new JSZip.external.Promise(function (resolve, reject) {
    JSZipUtils.getBinaryContent(zipuri, function(err, data) {
        if (err) {
            console.error("getBinaryContent err:", err);
            reject(err);
        } else {
            console.log("resolve began");
            resolve(data);
            console.log("resolve end");
        }
    });
});

var zipf;
function preview(fp){
    var zf = zipf.file(fp);
    console.log('zip.file', fp, zf);
    if(zf === null)return;
    zf.async("string")                    // 3) chain with the text content promise
    .then(function success(text){
        //console.log('zip.file.success', fp, text);
        // TODO: use text preview plugin
        $("#file_preview").replaceWith(
            $("<pre>", {id:"file_preview", class:"code"}).append(
                hljs.highlightAuto(text).value//.replaceAll('\n', '<br/>')//.replaceAll(' ', '&nbsp;')
                // hljs.highlightBlock(text).value
            //"class": "hljs",
            //text: text //.replaceAll('\n', '<br/>')
        ));
    }, function err(e){
        $("#file_preview").replaceWith($("<div>", {id:"file_preview"}).append($('<p>', {
            "class": "alert alert-success",
            text: e.message
        })));
    })
}    promise
.then(f=>{
    console.log("loadAsync", f);
    return JSZip.loadAsync(f)
})                            // 2) chain with the zip promise
.then(function success(zip) {
    zipf = zip;
    console.log('zip")', zip);

    zip.forEach(function (relativePath, zipEntry) {  // 2) print entries
        $("#file_list").append($("<li>")
        .append($("<a>", {
            //href : "javascript:;",// + zipEntry.name,
            href : "#" + zipEntry.name,
            text: zipEntry.name,
            // todo: use link action to add content preview
            onclick: "preview('"+zipEntry.name+"')"
        })));
    });
}, function error(e) {
    $("#jszip_utils").append($("<div>", {
        "class" : "alert alert-danger",
        text : "Error reading " + e.message
    }));
})
//.then(function success(text) {                    // 4) display the result
//    console.log("success(text)", text);
//    $("#jszip_utils").append($("<p>", {
//        "class": "alert alert-success",
//        text: "loaded, content = " + text
//    }));
//}, function error(e) {
//    console.error("error(e)", e);
//    $("#jszip_utils").append($("<p>", {
//        "class": "alert alert-danger",
//        text: e
//    }));
//});