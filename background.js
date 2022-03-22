/* Init Local Data */
if (!localStorage.getItem('site_label')) {
    localStorage.setItem('site_label', JSON.stringify({}))
}
if (!localStorage.getItem('page_label')) {
    localStorage.setItem('page_label', JSON.stringify({}))
}
if (!localStorage.getItem('label_category')) {
    localStorage.setItem('label_category', JSON.stringify([{ id: 0, name: 'Default' }]))
}
if (!localStorage.getItem('backup_time')) {
    var time = parseInt(new Date().getTime() / 1000)
    localStorage.setItem('backup_time', time)
}
if (navigator.userAgent.includes("Firefox")) {
    chrome = browser
}


/** Menu **/
chrome.contextMenus.create({
    title : "Set Sticky Note",
    onclick : function(info,tab) {
      chrome.tabs.sendMessage(tab.id, { info: 'setNote' })
    }
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // console.log(request)
    switch(request.type) {
        case 'setNote':
            var label_type = request.label_type == 1  ? 'site_label' : 'page_label'
            var labels = getLocalJson(label_type)
            labels[request.url] = {
                c: request.color,
                r: request.label,
                ct: request.category
            }
            localStorage.setItem(label_type, JSON.stringify(labels))
            sendResponse({success: 1, label_type: request.label_type, label:request.label, color: request.color, index: request.index});
            if(localStorage.getItem('synurl')) { // 异步任务
                sync_push()
            }
            break
        case 'removeNote':
            var label_type = request.label_type == 1  ? 'site_label' : 'page_label'
            var labels = getLocalJson(label_type)
            delete labels[request.url]
            localStorage.setItem(label_type, JSON.stringify(labels))
            sendResponse({success: 1, index: request.index, label_type: request.label_type})
            if (localStorage.getItem('synurl')) { // 异步任务
                sync_push()
            }
            break
        case 'queryLabelByUrl':
            if (request.label_type == 1) {
                var site_label = JSON.parse(localStorage.getItem('site_label'))
                var result = site_label[request.url]
            } else if(request.label_type == 2) {
                var page_label = JSON.parse(localStorage.getItem('page_label'))
                var result = page_label[request.url]
            }
            if (result) {
                sendResponse({ 
                    success: 1,
                    label: result.r,
                    color: result.c,
                    category: result.ct,
                    index: request.index,
                    label_type: request.label_type
                })
            } else {
                sendResponse({ 
                    success: 0,
                    label: '',
                    color: 1,
                    category: 0,
                    index: request.index,
                    label_type: request.label_type 
                })
            }
            break
        case 'queryAllLabels':
            sendResponse({
                success: 1,
                allLabels: {
                  site: getLocalJson('site_label'),
                  page: getLocalJson('page_label'),
                  category: getLocalJson('label_category')
                }
            })
            break
        case 'importAllLabels':
            localStorage.setItem('site_label', JSON.stringify(request.allLabels.site))
            localStorage.setItem('page_label', JSON.stringify(request.allLabels.page))
            localStorage.setItem('page_label', JSON.stringify(request.allLabels.category))
            sendResponse({ success: 1 })
            if(localStorage.getItem('synurl')) {
                sync_push()
            }
            break
        case 'addLabelCategory':
            if (request.categoryLabelName) {
                var category = getLocalJson('label_category')
                if (category.filter(item => item.name === request.categoryLabelName).length === 0) {
                    var id = category.reverse()[0].id + 1
                    category.push({ id: id, name: request.categoryLabelName })
                    localStorage.setItem('label_category', JSON.stringify(category.sort((a, b) => a.id - b.id)))
                    sendResponse({ success: 1, label_category: category })
                    if(localStorage.getItem('synurl')) {
                        sync_push()
                    }
                }
            }
            break;
        case 'delLabelCategory':
            if (request.categoryId) {
                var category = getLocalJson('label_category')
                category = category.filter(item => item.id != request.categoryId)
                var site_label = getLocalJson('site_label')
                Object.keys(site_label).forEach(item => {
                    if (site_label[item].ct == request.categoryId) {
                        site_label[item].ct = 0
                    }
                })
                var page_label = getLocalJson('page_label')
                Object.keys(page_label).forEach(item => {
                    if (page_label[item].ct == request.categoryId) {
                        page_label[item].ct = 0
                    }
                })
                localStorage.setItem('site_label', JSON.stringify(site_label))
                localStorage.setItem('page_label', JSON.stringify(page_label))
                localStorage.setItem('label_category', JSON.stringify(category.sort((a, b) => a.id - b.id)))
                sendResponse({ success: 1, label_category: category })
                if(localStorage.getItem('synurl')) {
                    sync_push()
                }
            }
            break;
        case 'updateLabelCategory':
            if (request.categoryId && request.newName) {
                var category = getLocalJson('label_category')
                category.forEach(item => {
                    if (item.id == request.categoryId) {
                        item.name = request.newName
                    }
                })
                localStorage.setItem('label_category', JSON.stringify(category.sort((a, b) => a.id - b.id)))
                sendResponse({ success: 1, label_category: category })
                if(localStorage.getItem('synurl')) {
                    sync_push()
                }
            }
            break;
        case 'queryLabelCategory':
            sendResponse({ success: 1, data: getLocalJson('label_category') })
            break;
        case 'saveSynInfo':
            const doSomethingWith = async () => {
                return await sync_pull((_res) => {
                    localStorage.setItem('site_label', JSON.stringify(_res.site))
                    localStorage.setItem('page_label', JSON.stringify(_res.page))
                    localStorage.setItem('label_category', JSON.stringify(_res.category))
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
            break
        case 'getSynInfo':
            if (localStorage.getItem('synurl')) {
                sendResponse({ success: 1, synurl: localStorage.getItem('synurl'), synusername: localStorage.getItem('synusername'), synpassword: localStorage.getItem('synpassword'), syntime: localStorage.getItem('syntime')})
            } else {
                sendResponse({success: 0 })
            }
            break
    }
})

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

const getLocalJson = _type => {
  return JSON.parse(localStorage.getItem(_type))
}
const sync_pull = _callback => {
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
    }).catch(error => console.log('webStickyNotes Config ERROR' + error))
}
const sync_push = _=> {
    let bodyData = JSON.stringify({
        site: getLocalJson('site_label'),
        page: getLocalJson('page_label'),
        category: getLocalJson('label_category')
    })
    let username = localStorage.getItem('synusername');
    let password = localStorage.getItem('synpassword');
    let url = localStorage.getItem('synurl');
    let auth_header = 'Basic ' + Base64.encode(username + ':' +password);
    fetch(url, {
        method: 'PUT',
        body: bodyData,
        headers: new Headers({
            "Authorization": auth_header
        }),
        credentials: "same-origin"
    }).then(response => {})
}
/* Synchronisation every 5 minutes */
if (localStorage.getItem('synurl')) {
    setInterval(function () {
        var time = parseInt(new Date().getTime() / 1000)
        var last_syn_time = localStorage.getItem('syntime')
        if (time - last_syn_time > 300) { // Synchronisation interval: 5 minutes
            sync_pull(function (_res) {
                localStorage.setItem('site_label', JSON.stringify(_res.site))
                localStorage.setItem('page_label', JSON.stringify(_res.page))
                localStorage.setItem('label_category', JSON.stringify(_res.category))
                localStorage.setItem('syntime', parseInt(new Date().getTime() / 1000))
            })
        }
    }, 60000); // 1 minutes
}
