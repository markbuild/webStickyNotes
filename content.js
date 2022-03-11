if (navigator.userAgent.includes("Firefox")) {
    chrome = browser
}
var mk_labels = []
var mk_label_index = 0
var icons = ['Ⓢ ','Ⓟ ']

document.addEventListener('DOMContentLoaded', _ => {
    if(self != top) return
    const labelSettingBlock = document.createElement("div")
    /* Create Dialog */
    chrome.runtime.sendMessage({type: 'queryLabelCategory'}, response => {
        if(response.success == 1) {
          var selecthtml = '<select>'
          response.data.forEach(item => {
            selecthtml += '<option value="' + item.id + '">' + item.name + '</option>'
          })
          selecthtml += '</select>'
          labelSettingBlock.innerHTML='<div id="mk_mask" class="mk_label_type_1"><div id="mk_label_setting">'+
              '<p><input type="radio" name="mk_label_type" value="1" checked>Notes for the Site Ⓢ: <span id="mk_url_site"></span></p><p><input type="radio" name="mk_label_type" value="2">Notes for the Page Ⓟ: <span id="mk_url_page"></span></p>'+
              '<p id="mk_label_1">Label Text: Ⓢ <input type="text" name="mk_label_1"></p>' +
              '<p id="mk_label_2">Label Text: Ⓟ <input type="text" name="mk_label_2"></p>' +
              '<p id="mk_label_category">Label Category: ' + selecthtml + '<button id="mk_label_category_add">Add New</button></p>' +
              '<p id="mk_label_color">Label Color:' +
              '<input type="radio" name="mk_label_color" value="1"><span class="mk_c1">Red</span> ' +
              '<input type="radio" name="mk_label_color" value="2"><span class="mk_c2">Yellow</span> ' +
              '<input type="radio" name="mk_label_color" value="3"><span class="mk_c3">Blue</span> ' +
              '<input type="radio" name="mk_label_color" value="4"><span class="mk_c4">Green</span></p>' +
              '<p><button id="mk_confirm">Confirm</button><button id="mk_cancel">Cancel</button> <button id="mk_remove">Remove Note</button>' +
              '</div></div>'
          document.body.appendChild(labelSettingBlock)
        }
    })
    
    /* Create Search Engine Result Button */
    if(location.hostname.includes('.google.') && location.pathname.startsWith('/search')) { // Check if this Page is Google Result Page
        document.querySelectorAll(".g").forEach(insertLabelInfoBlock)
    } else if(location.hostname.includes('.bing.') && location.pathname.startsWith('/search')) { // Check if this Page is Bing Result Page
        document.querySelectorAll(".b_algo").forEach(insertLabelInfoBlock)
    } else if(location.hostname.includes('yandex.') && location.pathname.startsWith('/search')) { // Check if this Page is Yandex Result Page
        document.querySelectorAll(".serp-item").forEach(insertLabelInfoBlock)
    } else { // duckduckgo 和baidu 没有直接URL，也不常用，不做了
        const labelInfoBlock = document.createElement("div");
        labelInfoBlock.id = 'mk_label_bar'
        document.body.appendChild(labelInfoBlock);
        insertLabelInfoBlock(labelInfoBlock, -1)
    }
})
// 插入 +
const insertLabelInfoBlock = (_elem, _index) => {
    if (_index === -1) {
      var page = location.origin + location.pathname
      _index = 0
    } else {
      var page = _elem.querySelector("a").href;
    }
    new RegExp(/\/\/([A-z0-9\.-]+)\//).test(page)
    var site = RegExp.$1;
    var url=[site, page];

    mk_labels[_index] = [{
      url: site
    }, {
      url: page
    }]
    const labelInfoBlock = document.createElement("div")
    labelInfoBlock.innerHTML='<div class="mk_edit" id="mk_edit'+_index+'" index="'+ _index +'"></div>'+
        '<div class="mk_label" id="mk_label_1_'+_index+'"></div>'+
        '<div class="mk_label" id="mk_label_2_'+_index+'"></div>'
    _elem.appendChild(labelInfoBlock)

    for(var i=1;i<=2;i++) {
        chrome.runtime.sendMessage({type: 'queryLabelByUrl', label_type:i, url: url[i-1], index: _index}, response => {
            var i = response.label_type
            if (response.label) {
                document.getElementById("mk_label_" + i + '_' + response.index).innerHTML = '<span class="mk_c' + response.color + '">'+ icons[i-1] + response.label + '</span>'
            } else {
                document.getElementById("mk_label_" + i + '_' + response.index).innerHTML = ''
            }
            mk_labels[response.index][i - 1].label = response.label
            mk_labels[response.index][i - 1].color = response.color
            mk_labels[response.index][i - 1].category= response.category
        })
    }
}

const showLabelSettingBlock = _index => {
    mk_label_index = _index
    var label = mk_labels[_index]
    document.getElementById('mk_url_site').innerText = label[0].url
    document.getElementById('mk_url_page').innerText = label[1].url
    var type = label[1].label ? 2 : 1 // Exist label for page
    document.querySelector('#mk_label_category select').value = label[type - 1].category
    var color = label[type - 1].color
    document.getElementById("mk_mask").className="mk_label_type_" + type
    document.getElementsByName("mk_label_type").value = type
    document.querySelectorAll("input[name=mk_label_type]").forEach(function(_elem) {
        _elem.checked = (_elem.value == type) 
    })
    document.getElementsByName("mk_label_color").value = color 
    document.querySelectorAll("input[name=mk_label_color]").forEach(function(_elem) {
        _elem.checked = (_elem.value == color) 
    })
    document.getElementsByName("mk_label_1")[0].value = label[0].label
    document.getElementsByName("mk_label_2")[0].value = label[1].label
    document.getElementById("mk_mask").style.display="block"
}

document.addEventListener('click', event => {
    // Search Result Page Click + Event
    if(event.target.className == "mk_edit") {
        var index = event.target.getAttribute('index')
        showLabelSettingBlock(index)
    }
    // Click Confirm Event
    if(event.target.getAttribute('id') == "mk_confirm") {
        var label_type = document.querySelectorAll("input[name=mk_label_type]:checked")[0].value
        var label = document.getElementsByName("mk_label_" + label_type)[0].value
        var url = mk_labels[mk_label_index][label_type - 1].url
        var label_category = document.querySelector('#mk_label_category select').value
        var label_color = document.querySelectorAll("input[name=mk_label_color]:checked")[0].value
        if (label_type && label_color && label) {
            chrome.runtime.sendMessage({
                type: 'setNote',
                url: url,
                label_type: label_type,
                label: label,
                color: label_color,
                category: label_category,
                index: mk_label_index
            }, response => {
                let i = response.label_type
                document.getElementById("mk_label_" + i + '_' + response.index).innerHTML = '<span class="mk_c' + response.color + '">'+ icons[i-1] + response.label + '</span>';
                mk_labels[response.index][i - 1].label = response.label
                mk_labels[response.index][i - 1].color = response.color
                mk_labels[response.index][i - 1].category = label_category
                document.getElementById('mk_mask').style.display = 'none'
            })
        } else {
            alert('Please check your input');
        }
    }
    // Add New Category
    if (event.target.getAttribute('id') === 'mk_label_category_add') {
        var name = prompt('Please enter new category name', '')
        if (name !== null && name !== '') {
            chrome.runtime.sendMessage({ type: 'addLabelCategory', categoryLabelName: name }, response => {
                if (response.label_category) {
                    var selecthtml = ''
                    response.label_category.forEach(item => {
                      selecthtml += '<option value="' + item.id + '">' + item.name + '</option>'
                    })
                    document.querySelector('#mk_label_category select').innerHTML = selecthtml
                }
            })
        }
    }
    // Clear Label 
    if(event.target.getAttribute('id') == "mk_remove") {
        var label_type = document.querySelectorAll("input[name=mk_label_type]:checked")[0].value;
        var url = mk_labels[mk_label_index][label_type - 1].url
        chrome.runtime.sendMessage({type: 'removeNote', url: url, label_type: label_type, index: mk_label_index }, response => {
            mk_labels[response.index][response.label_type - 1].label = ''
            mk_labels[response.index][response.label_type - 1].category = 0
            document.getElementById("mk_label_" + response.label_type + "_" + response.index).innerHTML = '';
            document.getElementById('mk_mask').style.display = 'none'
        });
    }
    // Switch Label Type
    if(event.target.getAttribute('name') == "mk_label_type") {
        var label_type = event.target.value;
        document.getElementById("mk_mask").className="mk_label_type_" + label_type;
        var color = mk_labels[mk_label_index][label_type - 1].color
        document.getElementsByName("mk_label_color").value = color; 
        document.querySelectorAll("input[name=mk_label_color]").forEach(function(_elem) { _elem.checked = (_elem.value == color) });
    }
    if(event.target.getAttribute('id') == "mk_cancel") {
        document.getElementById('mk_mask').style.display = 'none'
    }
}, false)

/* Listen Menu request */
chrome.extension.onMessage.addListener((request, _, response) => {
    switch(request.info) {
        case 'setNote':
            if (document.getElementById('mk_label_bar')) {
                showLabelSettingBlock(0)
            }
            break
    }
})
