document.getElementById("uploadbackupfile").addEventListener('change', (event) => {loadfile(event.target)}, false );
document.getElementById("downloadbackup").addEventListener('mouseover', (event) => {update_backup_link()}, false );


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
