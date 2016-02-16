// @link http://javascript.ru/tutorial/object/inheritance
// @link https://learn.javascript.ru/class-inheritance#%D0%BF%D0%BE%D0%BB%D0%BD%D1%8B%D0%B9-%D0%BA%D0%BE%D0%B4-%D0%BD%D0%B0%D1%81%D0%BB%D0%B5%D0%B4%D0%BE%D0%B2%D0%B0%D0%BD%D0%B8%D1%8F
function extend(Child, Parent) {
    var F = function() {}
    F.prototype = Parent.prototype
    Child.prototype = new F()
    Child.prototype.constructor = Child
    Child.superclass = Parent.prototype
}

// @link http://stackoverflow.com/a/13510502/3155344
var __entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
};
String.prototype.escapeHTML = function() {
    return String(this).replace(/[&<>"'\/]/g, function (s) {
        return __entityMap[s];
    });
}

Date.prototype.toYMD = function() {
    return this.getFullYear() +'.'+
          (this.getMonth()+1 < 10 ? '0' : '') + (this.getMonth()+1) +'.'+
          (this.getDate() < 10 ? '0' : '') + this.getDate();
}
Date.prototype.toHMS = function() {
    return (this.getHours()   < 10 ? '0' : '') + this.getHours() +':'+
           (this.getMinutes() < 10 ? '0' : '') + this.getMinutes() +':'+
           (this.getSeconds() < 10 ? '0' : '') + this.getSeconds();
}

Math.bound = function(value, minBoundary, maxBoundary) {
    return Math.max(Math.min(value, maxBoundary), minBoundary);
}

ArrayUtils = {};
ArrayUtils.diff = function(a, b) {
    return a.filter(function(i) { return b.indexOf(i) < 0; });
}

//@link http://stackoverflow.com/a/17772086/3155344
['Arguments', 'Array', 'Date', 'Function', 'Number', 'String', 'RegExp'].forEach(function(name) {
  window['is' + name] = function(obj) {
      return Object.prototype.toString.call(obj) === '[object '+ name +']';
  };
});


/**
 *
 * @param {String} URI
 * @returns {String}
 */
function encodeAnchorURI (URI) {
    return encodeURI(URI).replace(',', '%2C').replace('=', '%3D');
}

/**
 *
 * @param {String} URI
 * @returns {String}
 */
function decodeAnchorURI (URI) {
    return decodeURI(URI).replace('%2C', ',').replace('%3D', '=');
}


function getUrlVars(loc) {
    if (typeof loc == 'undefined') {
        loc = window.location;
    }

    if (typeof getUrlVars.cache == 'undefined') {
        getUrlVars.cache = {};
    }
    if (typeof getUrlVars.cache[loc] !== 'undefined') {
        return getUrlVars.cache[loc];
    }

    var vars = [], hashes, hash, pos;

    if (loc.search == '') {
        return vars;
    }

    hashes = loc.search.substr(1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        pos = hashes[i].indexOf('=');

        if (-1 == pos) {
            vars[hashes[i]] = true;
        } else {
            hash = [hashes[i].substr(0, pos), hashes[i].substr(pos + 1)];
            vars[hash[0]] = hash[1];
        }

        //vars.push(hash[0]);
    }

    getUrlVars.cache[loc] = vars;
    return getUrlVars.cache[loc];
}

function getUrlFragments(loc) {
    if (typeof loc == 'undefined') {
        loc = window.location;
    }

    if (typeof getUrlFragments.cache == 'undefined') {
        getUrlFragments.cache = {};
    }
    if (typeof getUrlFragments.cache[loc] !== 'undefined') {
        return getUrlFragments.cache[loc];
    }

    var hashes, pos,
        vars = [],
        // Cross-browser solution @link http://stackoverflow.com/a/1704842/3155344
        hash = loc.href.split('#')[1] || '';

    if (hash == '') {
        return vars;
    }

    hashes = hash.split(',');
    for (var i = 0; i < hashes.length; i++) {
        pos = hashes[i].indexOf('=');

        if (-1 == pos) {
            vars[hashes[i]] = true;
        } else {
            hash = [hashes[i].substr(0, pos), hashes[i].substr(pos + 1)];
            vars[decodeAnchorURI(hash[0])] = decodeAnchorURI(hash[1]);
        }
    }

    getUrlFragments.cache[loc] = vars;
    return getUrlFragments.cache[loc];
}

// @link http://stackoverflow.com/a/6644749/3155344
function parseUrl(url) {
    var a = document.createElement('a');
    a.href = url;
    return a;
}

function specifyFilter (currentParams, newParams) {
    var result = {};

    delete currentParams['page'];

    if (typeof getUrlFragments()['count'] == 'undefined') {
        delete currentParams['count'];
    }

    for (var i in currentParams) {
        result[i] = currentParams[i];
    }
    for (var i in newParams) {
        result[i] = newParams[i];
    }

    return result;
}

function renderAjaxPagination (paginationData, urlPrefix, addParams, container) {
    addParams = addParams || [];
    container = container || 'body';

    delete addParams['page'];
    delete addParams['count'];

    jQuery('.pagination.ajax', jQuery(container)).each(function () {
        jQuery(this).show();

        var lis = new Array(), prevPages = null;

        jQuery('li', this).remove();

        for (var i in paginationData['nav']) {
            var pageParams = paginationData['nav'][i],
                page = pageParams['number'],
                urlParams = addParams;

            if (prevPages != null && prevPages + 1 != page) {
                jQuery(this).append('<li class="disabled"><a href="#">&hellip;</a></li>');
            }

            if (page != 1) {
                urlParams['page'] = page;
            } else {
                delete urlParams['page'];
            }
            if (getUrlFragments()['count']) {
                urlParams['count'] = getUrlFragments()['count'];
            }

            jQuery(this).append('<li><a href="'+ urlPrefix +'#'+ concatUrlFragment(urlParams) +'">'+ page +'</a></li>');

            if (pageParams['active']) {
                jQuery('li:last', this).addClass('active');
            }

            prevPages = page;
        }
    });
}

/**
 *
 * @param Array set
 * @returns Array
 */
function nestedSetToNestedArray (set) {
    set.sort(function (a, b) {
        return a['ns_lft'] - b['ns_lft'];
    });

    var traverser = function (lft_value, rgt_value) {
        lft_value = lft_value || 0;
        var result = [];

        for (var i in set) {
            if (set[i]['ns_lft'] == lft_value + 1 && (! rgt_value || set[i]['ns_rgt'] < rgt_value)) {
                set[i]['children'] = traverser(set[i]['ns_lft'], set[i]['ns_rgt']);
                result.push(set[i]);

                lft_value = set[i]['ns_rgt'];
            }
        }

        return result;
    }

    return traverser();
}

function mergeFragments (newParams, replaceOld) {
    replaceOld = replaceOld || false;
    var result = {}, current = getUrlFragments(), newParamsCompact = {};

    // Replace array values by last value.
    for (var i in newParams) {
        newParamsCompact[newParams[i]['name']] = newParams[i]['value'];
    }

    for (var i in current) {
        if (replaceOld && i in newParamsCompact) {
            continue;
        }

        result[i] = current[i];
    }

    for (var i in newParamsCompact) {
        result[i] = newParamsCompact[i];
    }

    return result;
}

function concatUrlFragment (data) {
    var result = [];

    for (var i in data) {
        if (typeof data[i] != 'undefined') {
            result.push(encodeAnchorURI(i) +'='+ encodeAnchorURI(data[i]));
        }
    }

    return result.join(',');
}

function objectToTable (data, columnsCount, keysOrder) {
    var result = [], row = [];

    for (var field in keysOrder) {
        if (typeof data[field] === 'undefined' || data[field] == null) {
            continue;
        }

        row.push(field);

        if (row.length == columnsCount) {
            result.push(row);
            row = [];
        }
    }
    if (row.length) {
        while (row.length != columnsCount) {
            row.push(null);
        }
        result.push(row);
    }

    return result;
}

function getIndexesOfListItem (liNode) {
    var result = [], index;
    liNode = jQuery(liNode);

    while (liNode.parent('ol').length || liNode.parent('ul').length) {
        index = jQuery('> li', liNode.parent()).index(liNode);
        result.unshift(index + 1);
        liNode = liNode.parent().parent('li');
    }

    return result;
}

function ajaxFillSelect (field, emptyValue, containerNode, url) {
    url = url || '/api/get_variants.php';

    if (typeof emptyValue == 'undefined') {
        emptyValue = null;
    }

    var selectValue, visualWidth = 0,
        containerNode = containerNode || jQuery('label[for="'+ field +'"]').next('div');

    jQuery.get(url, {'field': field}, function (response) {
        if (checkResponseError(response, 'Error while get '+ field +' variants')) {
            return;
        }

        selectValue = getUrlFragments()[field];

        visualWidth = 0;
        for (var i in response['variants']) {
            visualWidth += String(response['variants'][i]).length * 8 + 12 * 2;
        }
        if (emptyValue !== null) {
            visualWidth += 42;
        }

        if (visualWidth > 360) {
            renderSelect(containerNode, field,
                response['variants'],
                emptyValue,
                selectValue);
        } else {
            renderButtonGroup(containerNode, field,
                response['variants'],
                emptyValue !== null ? 'All' : null,
                selectValue);
        }
    });
};

function renderSelect (containerNode, controlName, options, emptyValue, currentSelected) {
    containerNode.append('<select name="'+ controlName +'" id="'+ controlName +'" class="form-control"></select>');
    containerNode = jQuery('select:last', containerNode);

    if (emptyValue !== null) {
        containerNode.append('<option value="" selected="selected"></option>');
    }

    for (var i in options) {
        if (emptyValue !== null && options[i] === emptyValue) {
            continue;
        }

        containerNode
            .append(jQuery('<option></option>')
                    .attr('value', options[i])
                    .text(options[i]));

        if (currentSelected === String(options[i])) {
            containerNode.val(options[i]);
        }
    };
}

function renderButtonGroup (containerNode, controlName, buttons, emptyValue, currentSelected) {
    if (typeof currentSelected != 'undefined') {
    }

    if (! buttons.length) {
        return false;
    }

    containerNode.append('<div class="btn-group" data-toggle="buttons"></div>');
    containerNode = jQuery('div:last', containerNode);

    if (typeof emptyValue != 'undefined') {
        containerNode.append('<label class="btn btn-default active">'+
                             '<input type="radio" name="'+ controlName +'" value="" autocomplete="off" checked="checked">'+
                             emptyValue+
                             '</label>');
    }

    for (var i in buttons) {
        containerNode.append('<label class="btn btn-default"></label>');
        jQuery('label:last', containerNode).append('<input type="radio" name="'+ controlName +'" value="'+ buttons[i] +'" autocomplete="off">');
        jQuery('label:last', containerNode).append(String(buttons[i]).escapeHTML());
    }

    jQuery('input[name="'+ controlName +'"][value="'+ currentSelected +'"]').click()

    return true;
}

// @TODO Create WhiteLib.js and move all other code to it.
jQuery(document).on('click', 'a.anchor_link, .anchor_links_container a', function (e) {
    window.location = this;
    window.location.reload();
});

function checkResponseError (response, alertPrefix) {
    alertPrefix = alertPrefix || 'Error from server';

    if (! response || ! response['status'] || response['status'] != 'ok') {
        console.log('API resonse error', response);
        if (typeof response == 'object' && response['message']) {
            showAlert(alertPrefix +': '+ response['message']);
        } else {
            showAlert('Empty response from server');
        }

        return true;
    }

    return false;
}

function showAlert (message, type) {
    type = type || 'danger';
    var html = '<div class="alert alert-'+ type +' alert-dismissible" role="alert">'+
        '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>'+
        message +'</div>';
    jQuery('body').prepend(html);
    jQuery('body .alert:last').hide().fadeIn(400);
}

function bindAll(funcs, thisArg) {
    for (var funcName in funcs) {
        funcs[funcName] = funcs[funcName].bind(thisArg);
    }
}

// @link http://stackoverflow.com/a/5199982/3155344
jQuery.fn.serializeObject = function() {
    var result = {};

    jQuery.each(this.serializeArray(), function() {
        var value = (this.value != null) ? this.value : '';

        if (result[this.name] != null) {
            if (!result[this.name].push) {
                result[this.name] = [result[this.name]];
            }

            result[this.name].push(value);
        } else {
            result[this.name] = value;
        }
    });

    return result;
};

// @link http://stackoverflow.com/a/3886106/3155344
function isInteger(n) {
    return Number(n) === n && n % 1 === 0;
}

function isFloat(n) {
    return n === Number(n) && n % 1 !== 0;
}

function download(content, fileName, mimeType) {
    mimeType = mimeType || 'application/octet-stream';
    var blob = new Blob([content], {type: mimeType});
    saveAs(blob, fileName);
}

/**
 * Convert nested objects of any deep to flatten grid for rendering HTML table.
 * Order of cells depends on nesting order and order of elements of a leaf (if it's array).
 */
function flatNested (data, depth) {
    if (typeof depth === 'undefined') {
        depth = -1;
    }

    // Time to stop diving.
    if (depth == 0) {
        return [data];
    }
    // If not iterable.
    if (jQuery.type(data) !== 'array' && jQuery.type(data) !== 'object') {
        return [data];
    }

    var result = [];

    // TODO Fill delivered row container, not local array.
    jQuery.each(data, function(key, val) {
        var subFlat = flatNested(val, depth - 1);

        for (var j in subFlat) {
            var cells = [];

            // If data is object, then use current key as cell value.
            if (! Array.isArray(data)) {
                cells.push(key);
            }
            cells = cells.concat(subFlat[j]);

            result.push(cells);
        }
    });

    return result;
}

/**
 * Check previous row fields is duplicate current (by $index).
 */
function isDiffFromPreviousRow (arr, index, fields) {
    if (0 == index) {
        return false;
    }

    fields = Array.isArray(fields) ? fields : [fields];

    var isRepetition = true;
    fields.forEach(function(field) {
        isRepetition &= (arr[index - 1][field] == arr[index][field]);
    });

    return isRepetition;
}

/**
 * Returns count of duplicates of fields values in $arr after $index value.
 */
function repeatsCount (arr, index, fields) {
    fields = Array.isArray(fields) ? fields : [fields];

    var result = 0;

    for (var i = index + 1; i < arr.length; i++) {
        var isRepetition = true;
        fields.forEach(function(field) {
            isRepetition &= (arr[i][field] == arr[index][field]);
        });

        if (isRepetition) {
            result++;
        } else {
            break;
        }
    }

    return result;
}

/**
 * Update a part of sourceArray if elements content different from newDataArray.
 * Also delete and add whole keys of sourceArray - sync to keys of newDataArray.
 */
function syncArrays (sourceArray, newDataArray, isKeyEqual, updateValues) {
    // Delete disappeared records.
    for (var i = sourceArray.length - 1; i >= 0; i--) {
        var found = false;
        for (var j in newDataArray) {
            if (isKeyEqual(sourceArray[i], newDataArray[j])) {
                found = true;
                break;
            }
        }

        if (!found) {
            sourceArray.splice(i, 1);
        }
    }

    // Update exists records.
    for (var j in newDataArray) {
        var found = false;
        for (var i in sourceArray) {
            if (isKeyEqual(sourceArray[i], newDataArray[j])) {
                sourceArray[i] = updateValues(sourceArray[i], newDataArray[j]);
                found = true;
                break;
            }
        }

        if (!found) {
            // Add new records.
            sourceArray.push(newDataArray[j]);
        }
    }
}
