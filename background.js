if(!localStorage.getItem('google_result_site_remarks')) { // Init Setting
    localStorage.setItem('google_result_site_remarks', JSON.stringify({}));
}
if(!localStorage.getItem('google_result_page_remarks')) { // Init Setting
    localStorage.setItem('google_result_page_remarks', JSON.stringify({}));
}
if(navigator.userAgent.includes("Firefox")) {
    chrome = browser;
} 
chrome.runtime.onMessage.addListener((request,sender,sendResponse) => {
    // console.log(request)
    switch(request.type) {
        case 'insertRemarks':
            if(request.remarks_type == 1) {
                var google_result_site_remarks = JSON.parse(localStorage.getItem('google_result_site_remarks'))
                google_result_site_remarks[request.url] = {c:request.color, r:request.remarks}
                localStorage.setItem('google_result_site_remarks', JSON.stringify(google_result_site_remarks))
            } else if(request.remarks_type == 2) {
                var google_result_page_remarks = JSON.parse(localStorage.getItem('google_result_page_remarks'))
                google_result_page_remarks[request.url] = {c:request.color,r:request.remarks}
                localStorage.setItem('google_result_page_remarks', JSON.stringify(google_result_page_remarks))
            }
            sendResponse({success: 1, remarks_type: request.remarks_type, remarks:request.remarks, color: request.color, index: request.index});
            break;
        case 'removeRemarks':
            if(request.remarks_type == 1) {
                var google_result_site_remarks = JSON.parse(localStorage.getItem('google_result_site_remarks'))
                delete google_result_site_remarks[request.url];
                localStorage.setItem('google_result_site_remarks', JSON.stringify(google_result_site_remarks))
            } else if(request.remarks_type == 2) {
                var google_result_page_remarks = JSON.parse(localStorage.getItem('google_result_page_remarks'))
                delete google_result_page_remarks[request.url];
                localStorage.setItem('google_result_page_remarks', JSON.stringify(google_result_page_remarks))
            }
            sendResponse({success: 1, index: request.index, remarks_type: request.remarks_type});

            break;
        case 'queryRemarks':
            if(request.remarks_type == 1) {
                var google_result_site_remarks = JSON.parse(localStorage.getItem('google_result_site_remarks'))
                var result = google_result_site_remarks[request.url];
            } else if(request.remarks_type == 2) {
                var google_result_page_remarks = JSON.parse(localStorage.getItem('google_result_page_remarks'))
                var result = google_result_page_remarks[request.url];
            }
            if(result) {
                sendResponse({success: 1, remarks: result.r, color: result.c, index: request.index, remarks_type: request.remarks_type});
            } else {
                sendResponse({success: 0});
            }
            break;
        case 'queryAllRemarks':
            var google_result_site_remarks = JSON.parse(localStorage.getItem('google_result_site_remarks'))
            var google_result_page_remarks = JSON.parse(localStorage.getItem('google_result_page_remarks'))
            sendResponse({success: 1, allRemarks: {site: google_result_site_remarks, page: google_result_page_remarks}})
            break;
        case 'importAllRemarks':
            localStorage.setItem('google_result_site_remarks', JSON.stringify(request.allRemarks.site))
            localStorage.setItem('google_result_page_remarks', JSON.stringify(request.allRemarks.page))
            sendResponse({success: 1});
            break;
    }
});
