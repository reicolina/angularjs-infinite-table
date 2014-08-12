'use strict';

/* Services */

angular.module('myApp.services', [])
    // slightly modified version of:
    // angular-table
    // http://angulartable.com/
    .service('Debounce', function() {
        var self = this;

        // debounce() method is slightly modified version of:
        // Underscore.js 1.4.4
        // http://underscorejs.org
        // (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
        // Underscore may be freely distributed under the MIT license.
        self.debounce = function(func, wait, immediate) {
            var timeout,
                result;

            return function() {
                var context = this,
                    args = arguments,
                    callNow = immediate && !timeout;

                var later = function() {
                    timeout = null;

                    if (!immediate) {
                        result = func.apply(context, args);
                    }
                };

                clearTimeout(timeout);
                timeout = setTimeout(later, wait);

                if (callNow) {
                    result = func.apply(context, args);
                }

                return result;
            };
        };

        return self;
    })
    // slightly modified version of:
    // angular-table
    // http://angulartable.com/
    .service('JqLiteExtension', ['$window', 'Instrumentation', function($window, Instrumentation) {
        var self = this;

        // TODO: make this work with IE8<, android 3<, and ios4<: http://caniuse.com/getcomputedstyle
        self.getComputedPropertyAsFloat = function(rawDomElement, property) {
            var computedValueAsString = $window.getComputedStyle(rawDomElement).getPropertyValue(property).replace('px', '');

            Instrumentation.log('JqLiteExtension', 'className: ' + rawDomElement.className + '\n' + 'property: ' + property, computedValueAsString);
            return parseFloat(computedValueAsString);
        };

        self.getComputedWidthAsFloat = function(rawDomElement) {
            return self.getComputedPropertyAsFloat(rawDomElement, 'width');
        };

        self.getComputedHeightAsFloat = function(rawDomElement) {
            return self.getComputedPropertyAsFloat(rawDomElement, 'height');
        };

        return self;
    }])
    // slightly modified version of:
    // angular-table
    // http://angulartable.com/
    .service('ManualCompiler', ['TemplateStaticState', function(TemplateStaticState) {
        var self = this;

        self.compileRow = function(tElement, tAttrs, isHeader) {
            var headerUppercase = '';
            var headerDash = ''

            if(isHeader) {
                headerUppercase = 'Header';
                headerDash = 'header-'
            }

            // find whatever classes were passed into the row, and merge them with the built in classes for the tr
            tElement.addClass('angularTable' + headerUppercase + 'Row');

            // find whatever classes were passed into each column, and merge them with the built in classes for the td
            tElement.children().addClass('angularTable' + headerUppercase + 'Column');

            if(isHeader) {
                angular.forEach(tElement.children(), function(childColumn, index) {
                    if(angular.element(childColumn).attr('sortable') === 'true') {
                        // add the ascending sort icon
                        angular.element(childColumn).find('sort-arrow-descending').attr('ng-show',
                            'SortState.sortExpression == \'' + angular.element(childColumn).attr('sort-field-name') +
                            '\' && !SortState.sortDirectionToColumnMap[\'' + angular.element(childColumn).attr('sort-field-name') + '\']').addClass('angularTableDefaultSortArrowAscending');

                        // add the descending sort icon
                        angular.element(childColumn).find('sort-arrow-ascending').attr('ng-show',
                            'SortState.sortExpression == \'' + angular.element(childColumn).attr('sort-field-name') +
                            '\' && SortState.sortDirectionToColumnMap[\'' + angular.element(childColumn).attr('sort-field-name') + '\']').addClass('angularTableDefaultSortArrowDescending');

                        // add the sort click handler
                        angular.element(childColumn).attr('ng-click', 'setSortExpression(\'' +
                            angular.element(childColumn).attr('sort-field-name') + '\')');

                        // remove the sort field name attribute from the dsl
                        angular.element(childColumn).removeAttr('sort-field-name');
                    }
                });
            }

            // replace row with tr
            if(isHeader) {
                var rowTemplate = tElement[0].outerHTML.replace('<header-row', '<tr');
                rowTemplate = rowTemplate.replace('/header-row>', '/tr>')
            } else {
                var rowTemplate = tElement[0].outerHTML.replace('<row', '<tr');
                rowTemplate = rowTemplate.replace('/row>', '/tr>')
            }

            // replace column with td
            var columnRegexString = headerDash + 'column';
            var columnRegex = new RegExp(columnRegexString, "g");
            rowTemplate = rowTemplate.replace(columnRegex, 'td');

            if(isHeader) {
                rowTemplate = rowTemplate.replace(/sort-arrow-descending/g, 'div');
                rowTemplate = rowTemplate.replace(/sort-arrow-ascending/g, 'div');
            } else {
                var selectedBackgroundColor = '';
                var ngClick = '';

                TemplateStaticState.selectedRowColor = tAttrs.selectedColor;
                TemplateStaticState.evenRowColor = tAttrs.evenColor;
                TemplateStaticState.oddRowColor = tAttrs.oddColor;

                if(typeof(tAttrs.selectedColor) !== 'undefined' || typeof(tAttrs.evenColor) !== 'undefined' || typeof(tAttrs.oddColor) !== 'undefined' ) {
                    selectedBackgroundColor = 'ng-style="{ backgroundColor: getRowColor($index, row) }"';
                }

                if(typeof(tAttrs.onSelected) !== 'undefined') {
                    ngClick = ' ng-click="handleClick(row, \'' +
                        tAttrs.onSelected + '\', \'' + tAttrs.selectedColor + '\')" '
                }

                // add the ng-repeat and row selection click handler to each row
                rowTemplate = rowTemplate.replace('<tr',
                    '<tr ng-repeat="row in reddit.items | filter:filterQuery | orderBy:SortState.sortExpression:SortState.sortDirectionToColumnMap[SortState.sortExpression]" ' +
                        selectedBackgroundColor + ngClick);
            }

            // wrap our rows in a table, and a container div.  the container div will manage the scrolling.
            rowTemplate = '<div class="angularTable' + headerUppercase + 'TableContainer"><table infinite-scroll="reddit.nextPage()" infinite-scroll-disabled="reddit.busy" infinite-scroll-distance="3" infinite-scroll-container="" infinite-scroll-parent="" class="angularTable' + headerUppercase + 'Table">' + rowTemplate + '</table></div>';

            // replace the original template with the manually replaced and transcluded version
            tElement.replaceWith(rowTemplate);
        };
    }])
    // slightly modified version of:
    // angular-table
    // http://angulartable.com/
    .service('ResizeHeightEvent', function() {
        var self = this;

        // flip a boolean to indicate resize occured.  the value of the property has no meaning.
        self.fireTrigger = false;

        return self;
    })
    // slightly modified version of:
    // angular-table
    // http://angulartable.com/
    .service('ResizeWidthEvent', function() {
        var self = this;

        // flip a boolean to indicate resize occured.  the value of the property has no meaning
        self.fireTrigger = false;

        return self;
    })
    // slightly modified version of:
    // angular-table
    // http://angulartable.com/
    .service('ScrollingContainerHeightState', function() {
        var self = this;

        // get the padding, border and height for the outer angularTableContainer which holds the header table and the rows table
        self.outerContainerComputedHeight = 0;

        // store the offset height plus margin of the header so we know what the height of the scrolling container should be.
        self.headerComputedHeight = 0;

        return self;
    })
    // slightly modified version of:
    // angular-table
    // http://angulartable.com/
    .service('TemplateStaticState', function() {
        var self = this;

        // store selected, even and odd row background colors
        self.selectedRowColor = '';
        self.evenRowColor = '';
        self.oddRowColor = '';

        return self;
    })
    // slightly modified version of:
    // angular-table
    // http://angulartable.com/
    .service('RowState', function() {
        var self = this;

        // store a reference to the previously selected row so we can access it without looking it up from the bound model
        self.previouslySelectedRow = {};
        self.previouslySelectedRowColor = '';

        return self;
    })
    // slightly modified version of:
    // angular-table
    // http://angulartable.com/
    .service('SortState', function() {
        var self = this;

        // store the sort expression
        self.sortExpression = '';

        // store the columns sort direction mapping
        self.sortDirectionToColumnMap = {};

        return self;
    })
    // slightly modified version of:
    // angular-table
    // http://angulartable.com/
    .service('Instrumentation', ['TemplateStaticState', '$log', function(TemplateStaticState, $log) {
        var self = this;
        self.log = function(source, event, value) {
            if(TemplateStaticState.instrumentationEnabled) {
                $log.log('Source: ' + source);
                $log.log('Event: ' + event);
                $log.log('Value: ' + value);
                $log.log('------------------------\n');
            }
        };

        return self;
    }]);
