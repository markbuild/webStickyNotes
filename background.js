if(!localStorage.getItem('site_label')) { // Init Setting
    localStorage.setItem('site_label', JSON.stringify({}));
}
if(!localStorage.getItem('page_label')) { // Init Setting
    localStorage.setItem('page_label', JSON.stringify({}));
}
if(!localStorage.getItem('backup_time')) { // Init Setting
    var time = parseInt(new Date().getTime()/1000)
    localStorage.setItem('backup_time', time);
}
if(navigator.userAgent.includes("Firefox")) {
    chrome = browser;
} 
chrome.runtime.onMessage.addListener((request,sender,sendResponse) => {
    // console.log(request)
    switch(request.type) {
        case 'insertLabel':
            if(request.label_type == 1) {
                var site_label = JSON.parse(localStorage.getItem('site_label'))
                site_label[request.url] = {c:request.color, r:request.label}
                localStorage.setItem('site_label', JSON.stringify(site_label))
            } else if(request.label_type == 2) {
                var page_label = JSON.parse(localStorage.getItem('page_label'))
                page_label[request.url] = {c:request.color,r:request.label}
                localStorage.setItem('page_label', JSON.stringify(page_label))
            }
            sendResponse({success: 1, label_type: request.label_type, label:request.label, color: request.color, index: request.index});
            if(localStorage.getItem('synurl')){ // 异步任务
                sync_write();
            }
            break;
        case 'removeLabel':
            if(request.label_type == 1) {
                var site_label = JSON.parse(localStorage.getItem('site_label'))
                delete site_label[request.url];
                localStorage.setItem('site_label', JSON.stringify(site_label))
            } else if(request.label_type == 2) {
                var page_label = JSON.parse(localStorage.getItem('page_label'))
                delete page_label[request.url];
                localStorage.setItem('page_label', JSON.stringify(page_label))
            }
            sendResponse({success: 1, index: request.index, label_type: request.label_type});
            if(localStorage.getItem('synurl')){ // 异步任务
                sync_write();
            }
            break;
        case 'queryLabel':
            if(request.label_type == 1) {
                var site_label = JSON.parse(localStorage.getItem('site_label'))
                var result = site_label[request.url];
            } else if(request.label_type == 2) {
                var page_label = JSON.parse(localStorage.getItem('page_label'))
                var result = page_label[request.url];
            }
            if(result) {
                sendResponse({success: 1, label: result.r, color: result.c, index: request.index, label_type: request.label_type});
            } else {
                sendResponse({success: 0});
            }
            break;
        case 'queryAllLabels':
            var site_label = JSON.parse(localStorage.getItem('site_label'))
            var page_label = JSON.parse(localStorage.getItem('page_label'))
            sendResponse({success: 1, allLabels: {site: site_label, page: page_label}})
            break;
        case 'importAllLabels':
            localStorage.setItem('site_label', JSON.stringify(request.allLabels.site))
            localStorage.setItem('page_label', JSON.stringify(request.allLabels.page))
            sendResponse({success: 1});
            if(localStorage.getItem('synurl')){
                sync_write();
            }
            break;
        case 'saveSynInfo':
            const doSomethingWith = async () => {
                return await sync_read((_res) => {
                    localStorage.setItem('site_label', JSON.stringify(_res.site))
                    localStorage.setItem('page_label', JSON.stringify(_res.page))
                })
            }
            let synurl = request.synurl;
            let synusername = request.synusername;
            let synpassword = request.synpassword;
            localStorage.setItem('synurl', synurl)
            localStorage.setItem('synusername', synusername)
            localStorage.setItem('synpassword', synpassword)
            localStorage.setItem('syntime', parseInt(new Date().getTime()/1000))
            doSomethingWith().then(sendResponse({success: 1}));
            break;
        case 'getSynInfo':
            if(localStorage.getItem('synurl')){
                sendResponse({success: 1, synurl: localStorage.getItem('synurl'), synusername: localStorage.getItem('synusername'), synpassword: localStorage.getItem('synpassword'), syntime: localStorage.getItem('syntime')})
            } else {
                sendResponse({success: 0 })
            }
            break;
    }
});

/**
 *
 *  Base64 encode / decode
 *  http://www.webtoolkit.info/
 *
 **/
var Base64 = {

    // private property
    _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

    // public method for encoding
    encode : function (input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        input = Base64._utf8_encode(input);

        while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output +
                this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

        }

        return output;
    },

    // private method for UTF-8 encoding
    _utf8_encode : function (string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        return utftext;
    }
}

const sync_read = _callback => {
    let username = localStorage.getItem('synusername');
    let password = localStorage.getItem('synpassword');
    let url = localStorage.getItem('synurl');
    let auth_header = 'Basic ' + Base64.encode(username + ':' +password);
    fetch(url, {
        method: 'GET',
        headers: new Headers({
            "Authorization": auth_header
        }),
        credentials: "same-origin"
    }).then(response => response.json()).then(myJson => {
        _callback(myJson);
    }).catch(error => console.log(error));
}
const sync_write = _=> {
    let site_label = JSON.parse(localStorage.getItem('site_label'))
    let page_label = JSON.parse(localStorage.getItem('page_label'))
    let str = JSON.stringify({site: site_label, page: page_label});
    let username = localStorage.getItem('synusername');
    let password = localStorage.getItem('synpassword');
    let url = localStorage.getItem('synurl');
    let auth_header = 'Basic ' + Base64.encode(username + ':' +password);
    fetch(url, {
        method: 'PUT',
        body: str,
        headers: new Headers({
            "Authorization": auth_header
        }),
        credentials: "same-origin"
    }).then(response => {})
}
setInterval(function () {
    if(localStorage.getItem('synurl')) {
        var time = parseInt(new Date().getTime()/1000)
        var last_syn_time = localStorage.getItem('syntime')
        if(time - last_syn_time > 300){ // Synchronisation interval: 5 minutes
            sync_read(function(_res) {
                localStorage.setItem('site_label', JSON.stringify(_res.site))
                localStorage.setItem('page_label', JSON.stringify(_res.page))
                localStorage.setItem('syntime', parseInt(new Date().getTime()/1000))
            })
        }
    }
},60000); // 1 minutes
