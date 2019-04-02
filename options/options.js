document.getElementById("uploadbackupfile").addEventListener('change', (event) => {loadfile(event.target)}, false );
document.getElementById("downloadbackup").addEventListener('mouseover', (event) => {update_backup_link()}, false );
document.getElementById("display_all_btn").addEventListener('click', (event) => {display_all_reviews()}, false );
document.getElementById("savesyninfo").addEventListener('click', (event) => {savesyninfo()}, false );

const update_backup_link = _=> {
    chrome.runtime.sendMessage({type:'queryAllLabels'},function (response) {
        const str = JSON.stringify(response.allLabels);
        const blob = new Blob([str], {type: "text/json,charset=UTF-8"});
        const elem = document.getElementById("downloadbackup");
        elem.href = URL.createObjectURL(blob);
        elem.download = "webStickyNotes_database.bak";
    });
};

const loadfile = (event_this) => {
    var file = event_this.files[0];
    var reader = new FileReader();
    reader.onload = function() {
        var data = JSON.parse(reader.result); 
        chrome.runtime.sendMessage({type:'importAllLabels',allLabels: data},function (response) {
            if(response.success == 1) {
                alert('Import Success');
            }
        });
    };
    reader.readAsText(file);
};

const display_all_reviews = _=> {
    chrome.runtime.sendMessage({type:'queryAllLabels'},function (response) {
        var html='<table>'
        var k
        var keyword = document.getElementById('search').value.toLowerCase();
        for(k in response.allLabels.site){
            if(!keyword || (keyword && (k.toLowerCase().includes(keyword) || response.allLabels.site[k].r.toLowerCase().includes(keyword)))) 
            html += '<tr><td><a href="https://' + k + '" target="_blank">' + k + '</a></td><td><span class="mk_c' + response.allLabels.site[k].c + '">Ⓢ ' + response.allLabels.site[k].r + '</span></td></tr>';
        }
        for(k in response.allLabels.page){
            if(!keyword || (keyword && (k.toLowerCase().includes(keyword) || response.allLabels.page[k].r.toLowerCase().includes(keyword)))) 
            html += '<tr><td><a href="' + k + '" target="_blank">' + k + '</a></td><td><span class="mk_c' + response.allLabels.page[k].c + '">Ⓟ ' + response.allLabels.page[k].r + '</span></td></tr>';
        }
        document.getElementById('result').innerHTML = html + '</table>';
    });
};

const savesyninfo = _=> {
    var synurl = document.getElementById("synurl").value;
    var synusername = document.getElementById("synusername").value;
    var synpassword = document.getElementById("synpassword").value;
    if(synurl && synusername && synpassword) {
        chrome.runtime.sendMessage({type:'saveSynInfo', synurl: synurl, synusername: synusername, synpassword: synpassword},function (response) {
            if(response.success == 1){
                alert('Synchronized successful')
            }
        });
    } else {
        alert('Please put the URL, the Username and Password')
    }
}
function formatdate(_timestamp) {
    var date = new Date(+_timestamp),
        y = date.getFullYear(),
        m = date.getMonth() + 1,
        d = date.getDate(),
        h = date.getHours(),
        i = date.getMinutes(),
        s = date.getSeconds();
    m = m > 9? m : "0"+m;
    d = d > 9? d: "0"+d;
    h = h > 9? h: "0"+h;
    i = i > 9? i: "0"+i;
    s = s > 9? s: "0"+s;
    return y + '-' + m + '-' + d + ' ' + h + ':' + i + ':' + s;
}

chrome.runtime.sendMessage({type:'getSynInfo'},function (response) {
    if(response.success == 1) {
        document.getElementById("synurl").value = response.synurl;
        document.getElementById("synusername").value = response.synusername;
        document.getElementById("synpassword").value = response.synpassword;
        document.getElementById("last_syn_time").innerText = '(Last sync time: ' + formatdate(1000 * response.syntime) + ')';
    }
})
