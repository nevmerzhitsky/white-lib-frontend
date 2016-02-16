function BasicFilter(filterValues) {
    this.filterValues = filterValues || {};
    this.onSubmit = function(filterParams) {
        return filterParams;
    };
}

BasicFilter.prototype.init = function(formSelector, showCountInput) {
    if (! showCountInput) {
        jQuery('.form_footer .count', jQuery(formSelector)).hide();
    }

    this.initFormEffects(formSelector);
    this.checkFilterActiveAtReady();
}

BasicFilter.prototype.initFormEffects = function(formSelector) {
    // @TODO Really use formSelector value!
    jQuery(formSelector).hide();
    jQuery(document).on('click', '.filter .filter_switcher', function(e) {
        if (jQuery('.filter form').is(':visible')) {
            jQuery('.filter form').slideUp(100);
        } else {
            jQuery('.filter form').slideDown(200);
        }
    });

    jQuery('.filter *[type="reset"]').on('click', function(event) {
        jQuery('.filter *[data-toggle="buttons"] input[value=""]').click();
    });
}

BasicFilter.prototype.checkFilterActiveAtReady = function() {
    // Highlight filter toggle button if any parameter specified.
    for (var i in this.filterValues) {
        if (i == 'page' || i == 'count') {
            continue;
        }

        if (typeof this.filterValues[i] !== 'undefined'
                && this.filterValues[i].length) {
            jQuery('.filter .filter_switcher').removeClass('btn-default');
            jQuery('.filter .filter_switcher').addClass('btn-info');
            break;
        }
    }
}

BasicFilter.prototype.prepareTimePeriodFilter = function(format) {
    format = format || 'YYYY-MM-DD HH:mm:ss';
    var timePeriodStart, timePeriodFinish;

    if (!jQuery('#time_period_start').length
            || !jQuery('#time_period_finish').length) {
        return;
    }

    if (this.filterValues['time_period_start']) {
        timePeriodStart = moment(this.filterValues['time_period_start'], format);
    } else {
        timePeriodStart = false;
    }
    if (this.filterValues['time_period_finish']) {
        timePeriodFinish = moment(this.filterValues['time_period_finish'],
                format);
    } else {
        timePeriodFinish = false;
    }
    jQuery('#time_period_start').attr('value',
            this.filterValues['time_period_start']);
    jQuery('#time_period_start').datetimepicker({
        locale : 'ru-RU',
        format : format,
        defaultDate : timePeriodStart,
        showTodayButton : true,
    });
    jQuery('#time_period_finish').datetimepicker({
        locale : 'ru-RU',
        format : format,
        defaultDate : timePeriodFinish,
        showTodayButton : true,
    });

    // Set date boundaries.
    if (jQuery('#time_period_start').data('DateTimePicker').date()) {
        jQuery('#time_period_finish').data('DateTimePicker').minDate(
                jQuery('#time_period_start').data('DateTimePicker').date());
    }
    if (jQuery('#time_period_finish').data('DateTimePicker').date()) {
        jQuery('#time_period_start').data('DateTimePicker').maxDate(
                jQuery('#time_period_finish').data('DateTimePicker').date());
    }
    jQuery('#time_period_start').on(
            'dp.change',
            function(e) {
                jQuery('#time_period_finish').data('DateTimePicker').minDate(
                        e.date || false);
            });
    jQuery('#time_period_finish').on(
            'dp.change',
            function(e) {
                jQuery('#time_period_start').data('DateTimePicker').maxDate(
                        e.date || false);
            });
}

//--------------------------------------------------------------------------------

function UserSubmitFilter(filterValues) {
    UserSubmitFilter.superclass.constructor.apply(this, arguments);
}
extend(UserSubmitFilter, BasicFilter);

UserSubmitFilter.prototype.init = function(formSelector) {
    AnchorFilter.superclass.init.apply(this, arguments);

    var filter = this;

    // Submit a form is left to the filter client.
    jQuery(formSelector).submit(function(event) {
        event.preventDefault();
        filter.onSubmit();
    });
}

// --------------------------------------------------------------------------------

function AnchorFilter(filterValues) {
    AnchorFilter.superclass.constructor.apply(this, arguments);
}
extend(AnchorFilter, BasicFilter);

AnchorFilter.prototype.init = function(formSelector) {
    AnchorFilter.superclass.init.apply(this, arguments);

    var filter = this;

    // Reload page with parameters in anchor part of URL.
    jQuery(formSelector).submit(function(event) {
        event.preventDefault();

        var newParams = {},
            formArray = jQuery(this).serializeArray(),
            rawNewParams = mergeFragments(formArray);

        // Removing uncheck cheboxes manually because jQuery.serializeArray() does not return it.
        jQuery('*[type="checkbox"]', this).each(function () {
            var inputName = jQuery(this).prop('name');

            if (typeof rawNewParams[inputName] === 'undefined') {
                return;
            }

            for (var i in formArray) {
                if (formArray[i].name == inputName) {
                    return;
                }
            }

            delete rawNewParams[inputName];
        });

        for (var i in rawNewParams) {
            newParams[i] = rawNewParams[i];
        }

        delete newParams['page'];
        for (var i in newParams) {
            if (newParams[i] == '') {
                delete newParams[i];
            }
        }
        newParams = filter.onSubmit(newParams, rawNewParams);

        window.location.hash = concatUrlFragment(newParams);
        window.location.reload();
    });
}
