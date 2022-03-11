var categoryId = -1
document.getElementById("uploadbackupfile").addEventListener('change', (event) => {loadfile(event.target)}, false );
document.getElementById("downloadbackup").addEventListener('mouseover', (event) => {update_backup_link()}, false );
document.getElementById("search_btn").addEventListener('click', (event) => { searchResult()}, false );
document.getElementById('savesyninfo').addEventListener('click', (event) => { savesyninfo() }, false)
document.getElementById('category').addEventListener('click', (event) => {
    if (event.target.nodeName === 'LI') {
        // Add new Category
        if (event.target.getAttribute('data') == -2) {
            var name = prompt('Please enter new category name', '')
            if (name !== null && name !== '') {
                chrome.runtime.sendMessage({ type: 'addLabelCategory', categoryLabelName: name }, response => {
                    if (response.label_category) {
                        var html = '<li data="-1" class="active">All</li><li data="0">Default</li>'
                        response.label_category.forEach(item => {
                            if (item.id != 0) {
                                html += '<li data="' + item.id + '">' + item.name + '<span class="del">x</span></li>'
                            }
                        })
                        html += '<li data="-2">+</li>'
                        document.querySelector('#category').innerHTML = html
                    }
                })
            }
            return
        }
        document.querySelectorAll('#category li').forEach(item => {
            item.className = ''
        })
        categoryId = event.target.getAttribute('data')
        event.target.className = 'active'
        searchResult()
        if (categoryId > 0) {
            var categoryName = event.target.firstChild.textContent
            document.querySelector('#rename').innerHTML = '<input value="' + categoryName + '"> <button>Rename</button>'
        }
    }
    // Remove Category
    if (event.target.nodeName === 'SPAN') {
        if (!confirm('Do you want Remove this category?')) {
          return
        }
        chrome.runtime.sendMessage({ type: 'delLabelCategory', categoryId: event.target.parentNode.getAttribute('data') }, function (response) {
            if (response.label_category) {
                renderCategory(response.label_category)
            }
        })
    }
}, false);

document.getElementById('result').addEventListener('click', (event) => {
    if (event.target.className === 'del') {
        var url = event.target.getAttribute('url')
        var label_type = event.target.getAttribute('type')
        chrome.runtime.sendMessage({ type: 'removeNote', url: url, label_type: label_type, index: 0 }, response => {
            searchResult()
        })
    }
}, false);

document.getElementById('rename').addEventListener('click', (event) => {
    if (event.target.nodeName === 'BUTTON') {
        var newName = document.querySelector('#rename input').value
        chrome.runtime.sendMessage({ type: 'updateLabelCategory', newName: newName, categoryId: categoryId }, response => {
            if (response.label_category) {
                renderCategory(response.label_category)
            }
        })
    }
}, false);

const update_backup_link = _=> {
    chrome.runtime.sendMessage({type:'queryAllLabels'},function (response) {
        const str = JSON.stringify(response.allLabels);
        const blob = new Blob([str], {type: "text/json,charset=UTF-8"});
        const elem = document.getElementById("downloadbackup");
        elem.href = URL.createObjectURL(blob);
        elem.download = "webStickyNotes_database.bak";
    })
};

const loadfile = (event_this) => {
    var file = event_this.files[0]
    var reader = new FileReader()
    reader.onload = function() {
        var data = JSON.parse(reader.result); 
        chrome.runtime.sendMessage({type:'importAllLabels', allLabels: data},function (response) {
            if(response.success == 1) {
                alert('Import Success')
            }
        })
    }
    reader.readAsText(file)
}

const searchResult = _=> {
    chrome.runtime.sendMessage({type:'queryAllLabels'},function (response) {
        var html='<table>'
        var k
        var keyword = document.getElementById('search').value.toLowerCase();
        for(k in response.allLabels.site){
            if (categoryId == -1 || response.allLabels.site[k].ct == categoryId) {
                if(!keyword || (keyword && (k.toLowerCase().includes(keyword) || response.allLabels.site[k].r.toLowerCase().includes(keyword)))) 
                html += '<tr><td><a href="https://' + k + '" target="_blank">' + k + '</a></td><td><span class="mk_c' + response.allLabels.site[k].c + '">Ⓢ ' + response.allLabels.site[k].r + '</span><span class="del" url="' + k + '" type="1">x</span></td></tr>';
            }
        }
        for(k in response.allLabels.page){
            if (categoryId == -1 || response.allLabels.page[k].ct == categoryId) {
                if(!keyword || (keyword && (k.toLowerCase().includes(keyword) || response.allLabels.page[k].r.toLowerCase().includes(keyword)))) 
                html += '<tr><td><a href="' + k + '" target="_blank">' + k + '</a></td><td><span class="mk_c' + response.allLabels.page[k].c + '">Ⓟ ' + response.allLabels.page[k].r + '</span><span class="del" url="' + k + '" type="2">x</span></td></tr>';
            }
        }
        document.getElementById('result').innerHTML = html + '</table>';
    })
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

const renderCategory = _category => {
    var html = '<li data="-1" class="active">All</li><li data="0">Default</li>'
    _category.forEach(item => {
        if (item.id != 0) {
            html += '<li data="' + item.id + '">' + item.name + '<span class="del">x</span></li>'
        }
    })
    html += '<li data="-2">+</li>'
    document.querySelector('#category').innerHTML = html
}

chrome.runtime.sendMessage({type:'getSynInfo'},function (response) {
    if(response.success == 1) {
        document.getElementById("synurl").value = response.synurl;
        document.getElementById("synusername").value = response.synusername;
        document.getElementById("synpassword").value = response.synpassword;
        document.getElementById("last_syn_time").innerText = '(Last sync time: ' + formatdate(1000 * response.syntime) + ')';
    }
})

chrome.runtime.sendMessage({type:'queryLabelCategory' }, response => {
    if (response.success == 1) {
        renderCategory(response.data)
    }
})
searchResult()
