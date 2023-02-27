
export function getUrlParams() {
    const getUrlParamFromUrl = (key) => {
        let result = "";
        let url = window.location.href;
        let urlParams = url.split('?');
        if (urlParams.length > 1) {
            let params = urlParams[1];
            let paramsArr = params.split('&');
            paramsArr.forEach(item => {
                if (item.includes(key)) result = item.split('=')[1];
            });
        }
        return result;
    }
    let isView = getUrlParamFromUrl("isView") === "false" ? false : true;
    let hasLabel = getUrlParamFromUrl("hasLabel") === "false" ? false : true;
    return { isView, hasLabel }
}

