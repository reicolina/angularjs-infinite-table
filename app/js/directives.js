'use strict';

/* Directives */

angular.module('myApp.directives', [])
    // slightly modified version of:
    // angular-table
    // http://angulartable.com/
    .directive('angularTable', ['SortState',
        function(SortState) {
        return {
            // only support elements for now to simplify the manual transclusion and replace logic.
            restrict: 'E',
            // manually transclude and replace the template to work around not being able to have a template with td or tr as a root element
            // see bug: https://github.com/angular/angular.js/issues/1459
            compile: function (tElement, tAttrs) {
                SortState.sortExpression = tAttrs.defaultSortColumn;

                // find whatever classes were passed into the angular-table, and merge them with the built in classes for the container div
                tElement.addClass('angularTableContainer');

                var rowTemplate = tElement[0].outerHTML.replace('<angular-table', '<div class="angularTable"');
                rowTemplate = rowTemplate.replace('</angular-table>', '</div>');
                tElement.replaceWith(rowTemplate);

                // return linking function
                return function(scope) {
                    scope.parent = scope.$parent;
                };
            },
            scope: {
                tableModel: '='
            }
        };
    }])
    // slightly modified version of:
    // angular-table
    // http://angulartable.com/
    .directive('headerRow', ['ManualCompiler', 'ScrollingContainerHeightState', 'JqLiteExtension', 'SortState', 'ResizeHeightEvent', 'ResizeWidthEvent',
        function(ManualCompiler, ScrollingContainerHeightState, JqLiteExtension, SortState, ResizeHeightEvent, ResizeWidthEvent) {
        return {
            // only support elements for now to simplify the manual transclusion and replace logic.
            restrict: 'E',
            controller: ['$scope', '$parse', function($scope, $parse) {
                $scope.SortState = SortState;

                $scope.setSortExpression = function(columnName) {
                    SortState.sortExpression = columnName;

                    // track sort directions by sorted column for a better ux
                    SortState.sortDirectionToColumnMap[SortState.sortExpression] = !SortState.sortDirectionToColumnMap[SortState.sortExpression];
                };
            }],
            // manually transclude and replace the template to work around not being able to have a template with td or tr as a root element
            // see bug: https://github.com/angular/angular.js/issues/1459
            compile: function (tElement, tAttrs) {
                ManualCompiler.compileRow(tElement, tAttrs, true);

                // return a linking function
                return function(scope, iElement) {
                    scope.ResizeHeightEvent = ResizeHeightEvent;
                    scope.ResizeWidthEvent = ResizeWidthEvent;

                    // update the header width when the scrolling container's width changes due to a scrollbar appearing
                    // watches get called n times until the model settles. it's typically one or two, but processing in the functions
                    // must be idempotent and as such shouldn't rely on it being any specific number.
                    scope.$watch('ResizeWidthEvent', function() {
                        // pull the computed width of the scrolling container out of the dom
                        var scrollingContainerComputedWidth = JqLiteExtension.getComputedWidthAsFloat(iElement.next()[0]);

                        iElement.css('width', scrollingContainerComputedWidth + 'px');
                    }, true);
                };
            }
        };
    }])
    // slightly modified version of:
    // angular-table
    // http://angulartable.com/
    .directive('row', ['ManualCompiler', 'ResizeHeightEvent', '$window', 'Debounce', 'SortState',
        'ScrollingContainerHeightState', 'JqLiteExtension', 'ResizeWidthEvent', '$compile',
        function(ManualCompiler, ResizeHeightEvent, $window, Debounce, SortState, ScrollingContainerHeightState,
            JqLiteExtension, ResizeWidthEvent, $compile) {
        return {
            // only support elements for now to simplify the manual transclusion and replace logic.
            restrict: 'E',
            controller: ['$scope', function($scope) {
                $scope.sortExpression = SortState.sortExpression;
            }],
            // manually transclude and replace the template to work around not being able to have a template with td or tr as a root element
            // see bug: https://github.com/angular/angular.js/issues/1459
            compile: function (tElement, tAttrs) {
                ManualCompiler.compileRow(tElement, tAttrs, false);

                // return a linking function
                return function(scope, iElement) {
                    scope.ScrollingContainerHeightState = ScrollingContainerHeightState;
                    scope.SortState = SortState;

                    var getHeaderComputedHeight = function() {
                        return JqLiteExtension.getComputedHeightAsFloat(iElement.parent()[0]);
                    };

                    var getScrollingContainerComputedHeight = function() {
                        return JqLiteExtension.getComputedHeightAsFloat(angular.element(iElement.parent().children()[0])[0]);
                    };

                    angular.element($window).bind('resize', Debounce.debounce(function() {
                        // must apply since the browser resize event is not being seen by the digest process
                        scope.$apply(function() {
                            // flip the booleans to trigger the watches
                            ResizeHeightEvent.fireTrigger = !ResizeHeightEvent.fireTrigger;
                            ResizeWidthEvent.fireTrigger = !ResizeWidthEvent.fireTrigger;
                        });
                    }, 50));

                    // set the scrolling container height event on resize
                    // set the angularTableTableContainer height to angularTableContainer computed height - angularTableHeaderTableContainer computed height
                    // watches get called n times until the model settles. it's typically one or two, but processing in the functions
                    // must be idempotent and as such shouldn't rely on it being any specific number.
                    scope.$watch('ResizeHeightEvent', function() {
                        // pull the computed height of the header and the outer container out of the dom
                        var outerContainerComputedHeight = getHeaderComputedHeight();
                        var headerComputedHeight = getScrollingContainerComputedHeight()
                        var newScrollingContainerHeight = outerContainerComputedHeight - headerComputedHeight;
                        iElement.css('height', newScrollingContainerHeight + 'px');
                    }, true);

                    // scroll to top when sort applied
                    // watches get called n times until the model settles. it's typically one or two, but processing in the functions
                    // must be idempotent and as such shouldn't rely on it being any specific number.
                    scope.$watch('SortState', function() {
                        iElement[0].scrollTop = 0;
                    }, true);
                };
            }
        };
    }]);
