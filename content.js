const mlog = _info => {console.log('%c'+_info,"color:#fff;background-image:-webkit-gradient(linear, 0% 0%, 100% 100%, from(#DD5446), to(#F3BB28));border-radius:2px;padding:2px;font-weight:bold")}
mlog('bLabel Extension enabled on this Page. Help >> https://github.com/markbuild/bLabel#readme');
if(navigator.userAgent.includes("Firefox")) {
    chrome = browser;
} 

document.addEventListener("DOMContentLoaded", _ => {
    if(self != top) return;
    const labelSettingBlock = document.createElement("div")
    labelSettingBlock.innerHTML='<div id="mk_mask" class="labeltype_1"><div id="mk_label_settting">'+
        '<p><input type="radio" name="label_type" value="1" checked>Notes for the Site Ⓢ: <span id="mk_url_1"></span></p><p><input type="radio" name="label_type" value="2">Notes for the Page Ⓟ: <span id="mk_url_2"></span></p>'+
        '<p id="label_1">Label Text: Ⓢ <input type="text" name="label_1"></p>'+
        '<p id="label_2">Label Text: Ⓟ <input type="text" name="label_2"></p>'+
        '<p id="label_color">Label Color:'+
        '<input type="radio" name="label_color" value="1"><span class="mk_c1">Red</span> '+
        '<input type="radio" name="label_color" value="2"><span class="mk_c2">Yellow</span> '+
        '<input type="radio" name="label_color" value="3"><span class="mk_c3">Blue</span> '+
        '<input type="radio" name="label_color" value="4"><span class="mk_c4">Green</span></p>'+
        '<input type="hidden" name="label_index">'+
        '<p><button id="mk_confirm">Confirm</button><button id="mk_cancel">Cancel</button> <button id="mk_remove">Remove Label</button>'+
        '</div></div>'
    document.body.appendChild(labelSettingBlock);

    if(location.hostname.includes('.google.') && location.pathname.startsWith('/search')) { // Check if this Page is Google Result Page
        document.querySelectorAll(".g .r").forEach(insertLabelInfoBlock)
    } else if(location.hostname.includes('.bing.') && location.pathname.startsWith('/search')) { // Check if this Page is Bing Result Page
        document.querySelectorAll(".b_algo").forEach(insertLabelInfoBlock)
    } else if(location.hostname.includes('yandex.') && location.pathname.startsWith('/search')) { // Check if this Page is Yandex Result Page
        document.querySelectorAll(".serp-item h2").forEach(insertLabelInfoBlock)
    } else { // duckduckgo 和baidu 没有直接URL，也不常用，不做了
        let page = location.origin + location.pathname;
        /\/\/([A-z0-9\.-]+)\//.test(page);
        let site = RegExp.$1;
        var url=[site, page];

        const labelInfoBlock = document.createElement("div");
        labelInfoBlock.innerHTML='<div id="label_bar"><div class="mk_edit" id="mk_edit0" index="0" page="'+page+'" site="'+site+'" color1="1" color2="1"></div>'+
            '<div class="mk_label" id="mk_label_1_0"></div>'+
            '<div class="mk_label" id="mk_label_2_0"></div><div id="mk_hide">Hide</div></div>'
        document.body.appendChild(labelInfoBlock);

        for(var i=1;i<=2;i++) {
            chrome.runtime.sendMessage({type: 'queryLabel', label_type:i, url: url[i-1]}, response => {
                if(response.success == 1) {
                    let i = response.label_type;
                    let icons = ['Ⓢ ','Ⓟ '];
                    document.getElementById("mk_label_" + i + '_0').innerHTML = '<span class="mk_c' + response.color + '">'+ icons[i-1] + response.label + '</span>';
                    document.getElementById("mk_edit0").setAttribute("label_" + i, response.label);
                    document.getElementById("mk_edit0").setAttribute("color" + i, response.color);
                }
            })
        }
    }
});
// 插入 +
const insertLabelInfoBlock = (_elem, _index) => {
    let page = _elem.querySelector("a").href;
    /\/\/([A-z0-9\.-]+)\//.test(page);
    let site = RegExp.$1;
    var url=[site, page];

    const labelInfoBlock = document.createElement("div")
    labelInfoBlock.innerHTML='<div class="mk_edit" id="mk_edit'+_index+'" index="'+ _index +'" page="'+page+'" site="'+site+'" color1="1" color2="1"></div>'+
        '<div class="mk_label" id="mk_label_1_'+_index+'"></div>'+
        '<div class="mk_label" id="mk_label_2_'+_index+'"></div>'
    _elem.appendChild(labelInfoBlock)

    for(var i=1;i<=2;i++) {
        chrome.runtime.sendMessage({type: 'queryLabel', label_type:i, url: url[i-1], index: _index}, response => {
            if(response.success == 1) {
                let i = response.label_type
                let icons = ['Ⓢ ','Ⓟ '];
                document.getElementById("mk_label_" + i + '_' + response.index).innerHTML = '<span class="mk_c' + response.color + '">'+ icons[i-1] + response.label + '</span>';
                document.getElementById("mk_edit" + response.index).setAttribute("label_"+i, response.label)
                document.getElementById("mk_edit" + response.index).setAttribute("color"+i, response.color)
            }
        })
    }

}
document.addEventListener('click', event => {
    // Click + Event
    if(event.target.className == "mk_edit") {
        let page = event.target.getAttribute("page");
        let site = event.target.getAttribute("site");
        document.getElementById("mk_url_1").innerText = site;
        document.getElementById("mk_url_2").innerText = page; 
        var type = event.target.getAttribute('label_2')? 2 : 1 // Exist label for page
        var color = event.target.getAttribute('color' + type);
        // Init form
        document.getElementById("mk_mask").className="labeltype_" + type;
        document.getElementsByName("label_type").value = type; 
        document.querySelectorAll("input[name=label_type]").forEach(function(_elem) { _elem.checked = (_elem.value == type) });

        document.getElementsByName("label_1")[0].value = event.target.getAttribute("label_1");
        document.getElementsByName("label_2")[0].value = event.target.getAttribute("label_2");

        document.getElementsByName("label_color").value = color; 
        document.querySelectorAll("input[name=label_color]").forEach(function(_elem) { _elem.checked = (_elem.value == color) });

        document.getElementsByName("label_index")[0].value = event.target.getAttribute("index");
        document.getElementById("mk_mask").style.display="block";
        // End Init form
    }
    // Click Confirm Event
    if(event.target.getAttribute('id') == "mk_confirm") {
        var label_type = document.querySelectorAll("input[name=label_type]:checked")[0].value;
        var label = document.getElementsByName("label_" + label_type)[0].value;
        var url = document.getElementById("mk_url_" + label_type).innerText;
        var label_color = document.querySelectorAll("input[name=label_color]:checked")[0].value;
        var index = document.getElementsByName("label_index")[0].value;
        if(label_type && label_color && label){
            chrome.runtime.sendMessage({type: 'insertLabel', url: url, label_type: label_type, label: label, color: label_color, index: index}, response => {
                let i = response.label_type
                let icons = ['Ⓢ ','Ⓟ '];
                document.getElementById("mk_label_" + i + '_' + response.index).innerHTML = '<span class="mk_c' + response.color + '">'+ icons[i-1] + response.label + '</span>';
                document.getElementById("mk_edit" + response.index).setAttribute("label_"+i, response.label)
                document.getElementById("mk_edit" + response.index).setAttribute("color"+i, response.color)
 
                document.getElementById('mk_mask').style.display = 'none'
            })
        } else {
            alert('Please check your input');
        }
    }
    // Clear Label 
    if(event.target.getAttribute('id') == "mk_remove") {
        var label_type = document.querySelectorAll("input[name=label_type]:checked")[0].value;
        var url = document.getElementById("mk_url_" + label_type).innerText;
        var index = document.getElementsByName("label_index")[0].value;
        chrome.runtime.sendMessage({type: 'removeLabel', url: url, label_type: label_type, index: index}, response => {
            document.getElementById("mk_edit" + response.index).setAttribute("label_" + label_type, "");
            document.getElementById("mk_edit" + response.index).setAttribute("color" + label_type, "");
            document.getElementById("mk_label_" + response.label_type + "_" + response.index).innerHTML = '';

            document.getElementById('mk_mask').style.display = 'none'
        });
    }
    // Switch Label Type
    if(event.target.getAttribute('name') == "label_type") {
        var label_type = event.target.value;
        var index = document.getElementsByName("label_index")[0].value;
        document.getElementById("mk_mask").className="labeltype_" + label_type;
        var color = document.getElementById("mk_edit"+index).getAttribute("color" + label_type);
        document.getElementsByName("label_color").value = color; 
        document.querySelectorAll("input[name=label_color]").forEach(function(_elem) { _elem.checked = (_elem.value == color) });
    }
    if(event.target.getAttribute('id') == "mk_cancel") {
        document.getElementById('mk_mask').style.display = 'none'
    }
    if(event.target.getAttribute('id') == "mk_hide") {
        document.getElementById('label_bar').style.display = 'none'
    }
}, false);
