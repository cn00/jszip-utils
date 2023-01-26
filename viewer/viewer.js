"use strict";
var params = URLSearchParams && new URLSearchParams(document.location.search.substring(1));
var zipuri = params && params.get("url");
console.log("zipuri:", zipuri);

var endn = zipuri.indexOf('?')
var file_name = zipuri.substring(zipuri.lastIndexOf('/') + 1, endn > 0 ? endn : zipuri.length)
// 1) get a promise of the content
var promise = new JSZip.external.Promise(function (resolve, reject) {
    JSZipUtils.getBinaryContent(zipuri, function(err, data) {
        if (err) {
            console.error("getBinaryContent err:", err);
            reject(err);
        } else {
            $("#file_name").replaceWith($("<div>", {id:"file_name"}).append($('<p>', {
                text: file_name
            })));

            resolve(data);
        }
    });
});

var zipf;
function preview(fp){
    var zf = zipf.file(fp);
    if(zf === null)return;
    zf.async("string")                    // 3) chain with the text content promise
    .then(function success(text){
        // TODO: use text preview plugin
        $("#file_preview").replaceWith(
            $("<pre>", {id:"file_preview", class:"code"}).append(
                hljs.highlightAuto(text).value//.replaceAll('\n', '<br/>')//.replaceAll(' ', '&nbsp;')
        ));
    }, function err(e){
        $("#file_preview").replaceWith($("<div>", {id:"file_preview"}).append($('<p>', {
            "class": "alert alert-success",
            text: e.message
        })));
    })
}
promise
.then(f=>{
    return JSZip.loadAsync(f)
})                            // 2) chain with the zip promise
.then(function success(zip) {
    zipf = zip;

    var jsdata = []
    zip.forEach(function (relativePath, zipEntry) {  // 2) print entries
        if(relativePath[relativePath.length-1]==='/'){
            relativePath = relativePath.substring(0, relativePath.lastIndexOf('/'))
        }
        jsdata[jsdata.length] = {
            'id': relativePath,//.substring(relativePath.lastIndexOf('/')),
            'parent': relativePath.substring(0, relativePath.lastIndexOf('/')) || '#', //file_name
            'text': relativePath.substring(relativePath.lastIndexOf('/')),
        }
    });
     console.log("jsdata", jsdata)
     $('#file_list')
     // 监听事件
    .on('changed.jstree', function (e, data) {
        // console.log('Selected: ', data);
        preview(data.node.id)
        // 多选
        // var i, j, r = [];
        // for(i = 0, j = data.selected.length; i < j; i++) {
        //     r.push(data.instance.get_node(data.selected[i]).id);
        // }
    })
    .jstree({"core":{"data": jsdata}});

}, function error(e) {
    $("#jszip_utils").append($("<div>", {
        "class" : "alert alert-danger",
        text : "Error reading " + e.message
    }));
})
