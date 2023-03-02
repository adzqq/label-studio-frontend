
export function getUrlParams() {
  const getUrlParamFromUrl = (key) => {
    let result = '';
    const url = window.location.href;
    const urlParams = url.split('?');

    if (urlParams.length > 1) {
      const params = urlParams[1];
      const paramsArr = params.split('&');

      paramsArr.forEach(item => {
        if (item.includes(key)) result = item.split('=')[1];
      });
    }
    return result;
  };
  const isView = getUrlParamFromUrl('isView') === 'false' ? false : true;
  const hasLabel = getUrlParamFromUrl('hasLabel') === 'false' ? false : true;

  return { isView, hasLabel };
}

