function StatWidget(options) {
    options = options || {};

    this._refreshingContent = false;
    this._paginationParamsFilter = function(a) { return a; };
    this.params = {};

    this.dataUrl = null;
    this.ajaxFunc = jQuery.get;
    this.paginationUrl = null;
    this.hideEmptyPagination = true;
    this.onPageCount = 20;
    this.countInputBinded = false;
    this.customParams = function() {};
    this.containerSelector = 'body';
    this.totalCountSelector = '.total_count .number';
    this.exportToCsvWarning = true;

    this.timePeriodFiltering = false;
    this.timePeriodFormat = 'YYYY-MM-DD HH:mm';

    // Merging default and delivered params.
    for (var opt in options) {
        if ('_' === opt[0] || 'filter' == opt) {
            continue;
        }

        this[opt] = options[opt];
    }

    if (typeof this.timePeriodStartDefault === 'undefined') {
        this.timePeriodStartDefault = moment(0, 'HH').subtract(1, 'weeks').format(this.timePeriodFormat);
    }

    this._initAjaxLoader();
    this._initAjaxPagination();
    this._initActionsPanel();

    this.updateParams();
}

StatWidget.prototype.onBeforeRequest = function() {}
StatWidget.prototype.onResponse = function() {}
StatWidget.prototype.onAfterAjaxStart = function() {}
StatWidget.prototype.onAfterAjaxComplete = function() {}

StatWidget.prototype._initAjaxLoader = function() {
    var widget = this;

    jQuery(document).ajaxStart(function() {
        jQuery('.ajax_loader').show();
        widget.onAfterAjaxStart();
    });

    jQuery(document).ajaxComplete(function() {
        if (jQuery.active == 1) {
            jQuery('.ajax_loader').hide();
        }
        widget.onAfterAjaxComplete();
    });
}

StatWidget.prototype._initAjaxPagination = function() {
    var widget = this;

    jQuery(this.containerSelector).on('click', '.pagination.ajax a[href != "#"]', function (e) {
        e.stopPropagation();
        widget.render(getUrlFragments(this)['page'] || 1);
    });
}

StatWidget.prototype._initActionsPanel = function() {
    var widget = this;

    if (typeof this.onExportToCsv === 'function') {
        jQuery(this.containerSelector).on('click', '.actions_panel .export_csv', function (e) {
            if (widget.exportToCsvWarning && ! confirm('Are you sure want to export all pages to CSV file? This may break down the server.')) {
                return;
            }

            widget.exportToCsv();
        });
    }
}

StatWidget.prototype.updateParams = function() {
    var custom = this.customParams;
    this.params = this._typicalParams();

    if (typeof custom == 'function') {
        custom = custom(this);
    }

    for (var param in custom) {
        this.params[param] = custom[param];
    }
}

StatWidget.prototype._getCountValue = function() {
    var result = getUrlFragments()['count'];

    if (this.countInputBinded) {
        result = result || this._getPageCountFromStorage();
    }

    result = result || this.onPageCount;

    return result;
}

StatWidget.prototype._typicalParams = function(page) {
    var result = {
        page:  page || 1,
        count: this._getCountValue(),
    };

    if (this.timePeriodFiltering) {
        result['time_period_finish'] = getUrlFragments()['time_period_finish'] || undefined;

        if (typeof getUrlFragments()['time_period_start'] != 'undefined') {
            result['time_period_start'] = getUrlFragments()['time_period_start'];
        } else {
            result['time_period_start'] = this.timePeriodStartDefault;
        }
        if (result['time_period_finish'] &&
            moment(result['time_period_start']).diff(moment(result['time_period_finish'])) > 0) {
            result['time_period_finish'] = undefined;
        }
    }

    return result;
}

StatWidget.prototype.setOrder = function(field, direction) {
    this.params['order['+ field +']'] = direction;
}

StatWidget.prototype.render = function(page) {
    page = page || getUrlFragments()['page'] || getUrlVars()['page'];
    var widget = this;
    this.container = jQuery(this.containerSelector);
    this.params['page'] = page;

    if (this._refreshingContent) {
        return;
    }

    this._refreshingContent = true;

    if (this.totalCountSelector) {
        jQuery(this.totalCountSelector, this.container).text('?');
    }
    jQuery('.pagination.ajax', this.container).each(function () {
        jQuery(this).hide();
    });
    jQuery('.actions_panel', this.container).each(function () {
        jQuery(this).hide();
    });

    this.onBeforeRequest();
    this.ajaxFunc(this.dataUrl, this.params, function (response) {
        widget._refreshingContent = false;

        if (checkResponseError(response)) {
            return;
        }

        var pagination = response['pagination'] || null,
            order = response['records_order'] || [];
        if (widget.totalCountSelector &&
            typeof pagination == 'object' &&
            pagination !== null &&
            typeof pagination['total_count'] != 'undefined'
        ) {
            jQuery(widget.totalCountSelector, widget.container).text(pagination['total_count']);
        }

        widget.onResponse(response['records'], pagination, order);

        var emptyPagination = (pagination === null || typeof pagination['total_pages'] !== 'number' || pagination.total_pages == 1);
        var emptyRecords = (pagination === null || typeof pagination['total_count'] !== 'number' || pagination.total_count == 0);
        if (! emptyPagination || ! widget.hideEmptyPagination) {
            renderAjaxPagination(
                jQuery.extend(true, {}, pagination),
                widget.paginationUrl,
                widget._prepareParamsForPagination(),
                widget.containerSelector);
        }
        if (! emptyRecords) {
            jQuery('.actions_panel', this.container).each(function () {
                jQuery(this).show();
            });
        }
    });
}

StatWidget.prototype._prepareParamsForPagination = function() {
    var newParams = jQuery.extend(true, {}, this.params),
        rawNewParams = newParams;

    delete newParams['page'];
    for (var i in newParams) {
        if (newParams[i] == '') {
            delete newParams[i];
        }
    }

    return this._paginationParamsFilter(newParams, rawNewParams);
}

StatWidget.prototype.initFilter = function(submitHandler) {
    var widget = this, filter;
    var basicHandler = function(filterParams, rawNewParams) {
            if (widget.timePeriodFiltering) {
                if (filterParams['time_period_start'] == widget.timePeriodStartDefault) {
                    delete filterParams['time_period_start'];
                } else if (rawNewParams['time_period_start'] == '' || typeof rawNewParams['time_period_start'] === 'undefined') {
                    filterParams['time_period_start'] = '';
                }
            }

            return filterParams;
        };

    filter = new AnchorFilter(this.params);
    filter.init('#filter', this.countInputBinded);

    if (submitHandler) {
        submitHandler.widget = this;
        // Joining handling functions.
        filter.onSubmit = function(filterParams, rawNewParams) {
            filterParams = basicHandler(filterParams, rawNewParams);
            filterParams = submitHandler(filterParams, rawNewParams);

            return filterParams;
        };
    }

    this._paginationParamsFilter = filter.onSubmit;

    if (this.timePeriodFiltering) {
        filter.prepareTimePeriodFilter(this.timePeriodFormat);
    }

    return filter;
}

StatWidget.prototype.bindCountInput = function(selector) {
    var widget = this;
    this.countInputBinded = true;

    jQuery(selector).val(this._getCountValue());
    jQuery(selector).on('change', function() {
        widget._setPageCountFromStorage(this.value);
    });
}

StatWidget.prototype._setPageCountFromStorage = function(value) {
    if (! window.localStorage) {
        return;
    }

    window.localStorage.setItem(this.dataUrl, value)
}

StatWidget.prototype._getPageCountFromStorage = function() {
    if (! window.localStorage) {
        return null;
    }

    return window.localStorage.getItem(this.dataUrl);
}

StatWidget.prototype.exportToCsv = function() {
    if (typeof this.onExportToCsv !== 'function') {
        return;
    }

    // @TODO If one page, just generate file.

    var widget = this,
        params = jQuery.extend(true, {}, this.params);
    this.container = jQuery(this.containerSelector);

    if (this._refreshingContent) {
        return;
    }

    this._refreshingContent = true;

    delete params['page'];
    params['count'] = -1;

    if (typeof this.exportToCsvCustomParams !== 'undefined') {
        if (typeof this.exportToCsvCustomParams === 'function') {
            params = this.exportToCsvCustomParams(params);
        } else {
            jQuery.each(this.exportToCsvCustomParams, function(i, val) {
                params[i] = val;
            });
        }
    }

    this.ajaxFunc(this.dataUrl, params, function (response) {
        widget._refreshingContent = false;

        if (checkResponseError(response)) {
            return;
        }

        var pagination = response['pagination'] || null,
            order = response['records_order'] || [];

        var data = widget.onExportToCsv(response['records'], pagination, order);

        // @link http://stackoverflow.com/a/14966131/3155344
        var csvContent = '';
        data.forEach(function(infoArray, index) {
           dataString = infoArray.join(',');
           csvContent += index < data.length ? dataString+ "\n" : dataString;
        });

        download(csvContent, 'export.csv', 'text/csv;charset=utf-8');
    });
}

// --------------------------------------------------------------------------------

function setSortMarkers (widget, urlPrefix, fields, defaultSort, tableSelector) {
    var container = jQuery(tableSelector),
        params = jQuery.extend(true, {}, widget.params),
        currentField = defaultSort[0], currentDir = defaultSort[1];

    jQuery.each(fields, function(i, field) {
        if (getUrlFragments()['order['+ field +']']) {
            currentField = field;
            currentDir = getUrlFragments()['order['+ field +']'];
        }
    });

    jQuery.each(fields, function(i, field) {
        var html, sortName, tempParams, marker = '',
            cell = jQuery('*[class~="'+ field +'"]', container);

        sortName = 'order['+ field +']';
        tempParams = {};
        tempParams[sortName] = 'asc';

        html = cell.html();

        if (currentField == field) {
            if (currentDir == 'asc') {
                tempParams[sortName] = 'desc';
                marker = 'glyphicon-sort-by-attributes';
            } else {
                marker = 'glyphicon-sort-by-attributes-alt';
            }

            marker = ' <span class="glyphicon '+ marker +'"></span>';
            widget.setOrder(field, currentDir);
        }

        tempParams = specifyFilter(params, tempParams);
        html = '<a href="'+ urlPrefix +'#'+ concatUrlFragment(tempParams) +'" class="anchor_link">'+ html +'</a>'+ marker;
        cell.html(html);
    });
}

//--------------------------------------------------------------------------------

function loadMiniStatsBlock (options) {
    var defaultOptions = {
        apiUrl: null,
        apiParams: [],
        apiErrorMessage: 'Error while loading data from server',
        removeFieldsFromFilter: [],
        blockSelector: null,
        renderCallback: function() {},
    };
    options = jQuery.extend(true, defaultOptions, options);

    options.apiParams = jQuery.extend(true, {}, options.apiParams); // Copy for remove reference.
    options.blockContentSelector = options.blockContentSelector || options.blockSelector +' .content';
    options.blockNumberSelector  = options.blockNumberSelector  || options.blockSelector +' .number';
    options.blockTogglerSelector = options.blockTogglerSelector || options.blockSelector +' .toggler';

    jQuery.each(options.removeFieldsFromFilter, function (i, v) {
        delete options.apiParams[v];
    });

    jQuery(options.blockSelector +', '+ options.blockContentSelector).hide();

    jQuery.get(options.apiUrl, options.apiParams, function (response) {
        if (checkResponseError(response, options.apiErrorMessage)) {
            return;
        }

        jQuery(options.blockNumberSelector).text(Object.keys(response['records']).length);
        jQuery(options.blockContentSelector).html(options.renderCallback(options.apiParams, response));

        if (jQuery(options.blockContentSelector).text()) {
            jQuery(options.blockSelector).show();
        }
    });

    jQuery(document).on('click', options.blockTogglerSelector, function () {
        jQuery(options.blockContentSelector).toggle();
    });
}
