document.getElementById("uploadbackupfile").addEventListener('change', (event) => {loadfile(event.target)}, false );
document.getElementById("downloadbackup").addEventListener('mouseover', (event) => {update_backup_link()}, false );
document.getElementById("display_all_btn").addEventListener('click', (event) => {display_all_reviews()}, false );

const update_backup_link = () => {
    chrome.runtime.sendMessage({type:'queryAllRemarks'},function (response) {
        const str = JSON.stringify(response.allRemarks);
        const blob = new Blob([str], {type: "text/json,charset=UTF-8"});
        const elem = document.getElementById("downloadbackup");
        elem.href = URL.createObjectURL(blob);
        elem.download = "remark_google_results_database.bak";
    });
};

const loadfile = (event_this) => {
    var file = event_this.files[0];
    var reader = new FileReader();
    reader.onload = function() {
        var data = JSON.parse(reader.result); 
        chrome.runtime.sendMessage({type:'importAllRemarks',allRemarks: data},function (response) {
            alert('Import Success');
        });
    };
    reader.readAsText(file);
};

const display_all_reviews = () => {
    chrome.runtime.sendMessage({type:'queryAllRemarks'},function (response) {
        var html='<table>'
        var k
        var keyword = document.getElementById('search').value.toLowerCase();
        for(k in response.allRemarks.site){
            if(!keyword || (keyword && (k.toLowerCase().includes(keyword) || response.allRemarks.site[k].r.toLowerCase().includes(keyword)))) 
            html += '<tr><td><a href="https://' + k + '" target="_blank">' + k + '</a></td><td><span class="mk_c' + response.allRemarks.site[k].c + '">Ⓢ ' + response.allRemarks.site[k].r + '</span></td></tr>';
        }
        for(k in response.allRemarks.page){
            if(!keyword || (keyword && (k.toLowerCase().includes(keyword) || response.allRemarks.page[k].r.toLowerCase().includes(keyword)))) 
            html += '<tr><td><a href="' + k + '" target="_blank">' + k + '</a></td><td><span class="mk_c' + response.allRemarks.page[k].c + '">Ⓟ ' + response.allRemarks.page[k].r + '</span></td></tr>';
        }
        document.getElementById('result').innerHTML = html + '</table>';
    });
};
