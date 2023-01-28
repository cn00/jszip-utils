"use strict";
var params = URLSearchParams && new URLSearchParams(document.location.search.substring(1));
var zipuri = params && params.get("url");
console.log("zipuri:", zipuri);

var endn = zipuri.indexOf('?')
var file_name = zipuri.substring(zipuri.lastIndexOf('/') + 1, endn > 0 ? endn : zipuri.length)

function onLoadSuccess(zip) {
    console.log("onLoadSuccess", zip)
    var zipf
    zipf = zip;
    function preview(fp) {
        var zf = zipf.file(fp);
        if (zf === null) return;
        zf.async("string")                    // 3) chain with the text content promise
        .then(
            function success(text) {
            // TODO: use text preview plugin
            $("#file_preview_content").replaceWith(
                $("<pre>", { id: "file_preview_content", class: "code"}).append(
                    hljs.highlightAuto(text).value//.replaceAll('\n', '<br/>')//.replaceAll(' ', '&nbsp;')
                ));
            }, 
            function err(e) {
                $("#file_preview").replaceWith($("<div>", { id: "file_preview" }).append($('<p>', {
                    "class": "alert alert-success",
                    text: e
                })));
            }
        )
    }

    var jsdata = []
    function addJsNode(){

    }
    zip.forEach(function (relativePath, zipEntry) {
        // console.log(relativePath)
        if (relativePath[relativePath.length - 1] === '/') {
            relativePath = relativePath.substring(0, relativePath.lastIndexOf('/'))
        }
        var parent = relativePath.substring(0, relativePath.lastIndexOf('/')) || '#'
        if (parent !== '#') {
            var pexist = false
            for (var i = 0; i < jsdata.length; i++) {
                var pi = jsdata[i]
                if (pi.id === parent) {
                    pexist = true;
                    break;
                }
            }
            if (!pexist) {
                console.log('top single node', parent)
                jsdata[jsdata.length] = {
                    'id': parent,
                    'parent': '#',
                    'text': parent//.substring(parent.lastIndexOf('/')),
                }
            }
        }
        console.log('node', relativePath)
        jsdata[jsdata.length] = {
            'id': relativePath,
            'parent': parent || '#',
            'text': relativePath.substring(relativePath.lastIndexOf('/') + 1),
        }
    });
    // console.log("jsdata", jsdata.filter((i,idx,arr)=>{
    //     console.log('filter', idx, i)
    //     return arr.indexOf(i, 0) === idx
    // }))
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
        .jstree({ "core": { "data": jsdata } });

}
function onLoadError(e) {
    $("#file_preview").append($("<div>", {
        "class": "alert alert-danger",
        text: "Error reading " + e.message
    }));
}

// window.addEventListener('fetch-progress', (e) => {
//     // setProgressbarValue(e.detail);
//     let process = e.detail.received*100/e.detail.length
//     // console.log("fetch-progress",  process, e)
//     $("#progress-bar").progressbar({
//         value: process
//     })
//     // progressbar.value=e.received*100/e.length
// });

// http://louiszhai.github.io/2016/11/02/fetch/#progress
async function progress(response) {
    var reader = response.body.getReader()
    var cl = response.headers.get("content-length")
    console.log("response content-length",cl);
    var received = 0
    // var data = new Uint8Array(1024*1024*512)
    // https://dev.to/tqbit/how-to-monitor-the-progress-of-a-javascript-fetch-request-and-cancel-it-on-demand-107f
    let chunks = [];
    await new Promise((resolve, reject) => {
        function pump() {
            reader.read().then(part => {
                // console.log(`res_part`, part);
                //   data.append(...part.value)
                if (part.done) {
                    console.log("response last part", received)
                    resolve();
                    return
                }
                chunks.push(part.value);
                received += part.value.length;
                let process = received*100/cl
                // console.log("process", process)
                $("#progress-bar").progressbar({
                    value: process
                })
            
                // const payload = {detail:{ received:received, length:cl, loading:true }}
                // const onProgress = new CustomEvent('fetch-progress', payload);
                // const onFinished = new CustomEvent('fetch-finished', payload)
                // window.dispatchEvent(onProgress); 

                pump();
            }).catch(reject)
        }
        pump();
    });
 
    // Concat the chinks into a single array
    let body = new Uint8Array(received);
    let position = 0;

    // Order the chunks by their respective position
    for (let chunk of chunks) {
        body.set(chunk, position);
        position += chunk.length;
    }
    // console.log("body", body)
    return Promise.resolve(body);
}
fetch(zipuri, { mode: 'no-cors' })
    .then(response => progress(response))
    .then(JSZip.loadAsync)
    .then(onLoadSuccess, onLoadError)
    .catch(e => console.error("something went wrong: " + e));
