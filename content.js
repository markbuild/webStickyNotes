const mlog = _info => {console.log('%c'+_info,"color:#fff;background-image:-webkit-gradient(linear, 0% 0%, 100% 100%, from(#DD5446), to(#F3BB28));border-radius:2px;padding:2px;font-weight:bold")}
mlog('Remark Google Results Extension enabled on this Page. Help >> https://github.com/markbuild/remark-google-results#readme');
if(navigator.userAgent.includes("Firefox")) {
    chrome = browser;
} 

document.addEventListener("DOMContentLoaded", _ => {
    if(location.hostname.includes('.google.') && location.pathname.startsWith('/search')) { // Check if this Page is Google Result Page
        const remarksSettingBlock = document.createElement("div")
        remarksSettingBlock.innerHTML='<div id="mk_mask" class="remarkstype_1"><div id="mk_remarks_settting">'+
            '<p><input type="radio" name="remarks_type" value="1" checked>Remarks for this Site Ⓢ: <span id="mk_url_1"></span></p><p><input type="radio" name="remarks_type" value="2">Remarks for this Page Ⓟ: <span id="mk_url_2"></span></p>'+
            '<p id="remarks_1">Site Remarks: Ⓢ <input type="text" name="remarks_1"></p>'+
            '<p id="remarks_2">Page Remarks: Ⓟ <input type="text" name="remarks_2"></p>'+
            '<p id="remarks_color">Remarks Color:'+
            '<input type="radio" name="remarks_color" value="1"><span class="mk_c1">Red</span> '+
            '<input type="radio" name="remarks_color" value="2"><span class="mk_c2">Yellow</span> '+
            '<input type="radio" name="remarks_color" value="3"><span class="mk_c3">Blue</span> '+
            '<input type="radio" name="remarks_color" value="4"><span class="mk_c4">Green</span></p>'+
            '<input type="hidden" name="remark_index">'+
            '<p><button id="mk_confirm">Confirm</button><button id="mk_cancel" onclick="document.getElementById(\'mk_mask\').style.display=\'none\'">Cancel</button> <button id="mk_remove">Remove this remarks</button>'+
            '</div></div>'
        document.body.appendChild(remarksSettingBlock);

        document.querySelectorAll(".g .r").forEach(function(_elem, _index){
            let page = _elem.querySelector("a").href;
            /\/\/([A-z0-9\.-]+)\//.test(page);
            let site = RegExp.$1;
            var url=[site, page];

            const remarksInfoBlock = document.createElement("div")
            remarksInfoBlock.innerHTML='<div class="mk_edit" id="mk_edit'+_index+'" index="'+ _index +'" page="'+page+'" site="'+site+'" color1="1" color2="1">+</div>'+
                '<div class="mk_label" id="mk_label_1_'+_index+'"></div>'+
                '<div class="mk_label" id="mk_label_2_'+_index+'"></div>'
            _elem.appendChild(remarksInfoBlock)

            for(var i=1;i<=2;i++) {
                chrome.runtime.sendMessage({type: 'queryRemarks', remarks_type:i, url: url[i-1], index: _index}, response => {
                    if(response.success == 1) {
                        let i = response.remarks_type
                        let icons = ['Ⓢ ','Ⓟ '];
                        document.getElementById("mk_label_" + i + '_' + response.index).innerHTML = '<span class="mk_c' + response.color + '">'+ icons[i-1] + response.remarks + '</span>';
                        document.getElementById("mk_edit" + response.index).setAttribute("remarks_"+i, response.remarks)
                        document.getElementById("mk_edit" + response.index).setAttribute("color"+i, response.color)
                    }
                })
            }
        })
    }
});
document.addEventListener('click', event => {
    // Click + Event
    if(event.target.className == "mk_edit") {
        let page = event.target.getAttribute("page");
        let site = event.target.getAttribute("site");
        document.getElementById("mk_url_1").innerText = site;
        document.getElementById("mk_url_2").innerText = page; 
        var type = event.target.getAttribute('remarks_2')? 2 : 1 // Exist remarks for page
        var color = event.target.getAttribute('color' + type);
        // Init form
        document.getElementById("mk_mask").className="remarkstype_" + type;
        document.getElementsByName("remarks_type").value = type; 
        document.querySelectorAll("input[name=remarks_type]").forEach(function(_elem) { _elem.checked = (_elem.value == type) });

        document.getElementsByName("remarks_1")[0].value = event.target.getAttribute("remarks_1");
        document.getElementsByName("remarks_2")[0].value = event.target.getAttribute("remarks_2");

        document.getElementsByName("remarks_color").value = color; 
        document.querySelectorAll("input[name=remarks_color]").forEach(function(_elem) { _elem.checked = (_elem.value == color) });

        document.getElementsByName("remark_index")[0].value = event.target.getAttribute("index");
        document.getElementById("mk_mask").style.display="block";
        // End Init form
    }
    // Click Confirm Event
    if(event.target.getAttribute('id') == "mk_confirm") {
        var remarks_type = document.querySelectorAll("input[name=remarks_type]:checked")[0].value;
        var remarks = document.getElementsByName("remarks_" + remarks_type)[0].value;
        var url = document.getElementById("mk_url_" + remarks_type).innerText;
        var remarks_color = document.querySelectorAll("input[name=remarks_color]:checked")[0].value;
        var index = document.getElementsByName("remark_index")[0].value;
        if(remarks_type && remarks_color && remarks){
            console.log({type: 'insertRemarks', url: url, remarks_type: remarks_type, remarks: remarks, color: remarks_color, index: index});
            chrome.runtime.sendMessage({type: 'insertRemarks', url: url, remarks_type: remarks_type, remarks: remarks, color: remarks_color, index: index}, response => {
                let i = response.remarks_type
                let icons = ['Ⓢ ','Ⓟ '];
                document.getElementById("mk_label_" + i + '_' + response.index).innerHTML = '<span class="mk_c' + response.color + '">'+ icons[i-1] + response.remarks + '</span>';
                document.getElementById("mk_edit" + response.index).setAttribute("remarks_"+i, response.remarks)
                document.getElementById("mk_edit" + response.index).setAttribute("color"+i, response.color)
 
                document.getElementById('mk_mask').style.display = 'none'
            })
        } else {
            alert('Please check your input');
        }
    }
    // Clear Remark
    if(event.target.getAttribute('id') == "mk_remove") {
        var remarks_type = document.querySelectorAll("input[name=remarks_type]:checked")[0].value;
        var url = document.getElementById("mk_url_" + remarks_type).innerText;
        var index = document.getElementsByName("remark_index")[0].value;
        chrome.runtime.sendMessage({type: 'removeRemarks', url: url, remarks_type: remarks_type, index: index}, response => {
            document.getElementById("mk_edit" + response.index).setAttribute("remarks_" + remarks_type, "");
            document.getElementById("mk_edit" + response.index).setAttribute("color" + remarks_type, "");
            document.getElementById("mk_label_" + response.remarks_type + "_" + response.index).innerHTML = '';

            document.getElementById('mk_mask').style.display = 'none'
        });
    }
    // Switch Remarks Type
    if(event.target.getAttribute('name') == "remarks_type") {
        var remarks_type = event.target.value;
        var index = document.getElementsByName("remark_index")[0].value;
        document.getElementById("mk_mask").className="remarkstype_" + remarks_type;
        var color = document.getElementById("mk_edit"+index).getAttribute("color" + remarks_type);
        document.getElementsByName("remarks_color").value = color; 
        document.querySelectorAll("input[name=remarks_color]").forEach(function(_elem) { _elem.checked = (_elem.value == color) });
    }
}, false);
