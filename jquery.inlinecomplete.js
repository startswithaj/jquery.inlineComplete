(function ($) {
    'use strict';

    var _inlineComplete = {
        /**
         * Check browser support for HTML5 <datalist>
         * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/datalist
         *
         * @var bool
         */
        dataListSupport: !!(document.createElement('datalist') && window.HTMLDataListElement),

        _defaultOptions:{
            list: [],
            disableDataList: false
        },

        /**
         * Searches for a term in the terms-list which starts with userInput.
         * @param userInput
         * @param terms
         * @returns {string|null}
         * @private
         */
        _searchTerm: function(userInput, terms) {
            for (var i in terms) {
                if (terms[i].toLowerCase().substr(0, userInput.length) == userInput) {
                    return terms[i];
                }
            }
            return null;
        },

        /**
         * Fetches the current "word" the cursor is placed in. Technically this
         * reads the passed text from the passed cursor position backwards
         * until a space is reached.
         * TODO This should actually search for the first non-alphabetic character (".", ",", ":", etc.)
         * @param text
         * @param cursorPosition
         * @returns {string}
         * @private
         */
        _getCurrentWord: function(text, cursorPosition) {
            var start = text.substr(0, cursorPosition).lastIndexOf(' ') + 1;
            return text.substr(start, cursorPosition);
        },

        /**
         * Performs the actual inline complete. Usually the body of the event
         * callback.
         * @param {Node} inputElement
         * @param {Object} event
         * @param {Object} options
         */
        _performComplete:function (inputElement, event) {
            console.log(event.which);
            var list = inputElement.data('termList')
            if (event.which == 8 || event.which == 46 // Backspace, del
                || event.ctrlKey || event.which == 17 // Ctrl + Letter, or Ctrl
                || !list || list.length == 0 || event.metaKey || event.which == 91
            ) {
                return true;
            } else if (event.which == 16) {
                return this;
            }


            var $inputElement = $(inputElement),
                userInput     = this._getCurrentWord($inputElement.val()),
                returnValue   = true;

            if (userInput != '') {
                userInput = userInput.toLowerCase();
                // On keydown we get the key pressed
                // Check to see if it's a part of the remaining selection
                // If it is we simply return false suppressing keyUp
                // And incrementing one letter forward in the selection
                // (i.e deselecting the next letter in the match)
                // Take the word Peter
                // P was entered previously current selection is "eter"
                // user presses 'e' we check to see if its the next character in 'eter'
                // it is so we make the selection 'ter' and return false
                if (event.type == 'keydown') {

                    // Move selection
                    var selection = $inputElement.__getSelection(),
                        letter    = String.fromCharCode(event.which);

                    if (letter == '')
                        return returnValue;

                    // Tab completion
                    // If there is a selection and tab is pressed go to end of selection
                    if (event.which == 9 && selection != '') {
                        $inputElement.__moveSelectionStart(selection.length);
                        event.preventDefault();
                        returnValue = false;
                    }
                    // String.fromCharCode returns uppercase...
                    if (!event.shiftKey) {
                        letter = letter.toLowerCase();
                    }

                    if (letter.toLowerCase() == selection.substr(0, 1).toLowerCase()) {
                        $inputElement.__moveSelectionStart(1);
                        returnValue = false;
                    }
                } else if(event.type == 'keyup') {
                    var curPos     = $inputElement.__cursorPosition(),
                        inputValue = $inputElement.val();

                    var foundTerm = this._searchTerm(userInput, list);
                    // When a term was found and the input changed from the
                    // last time this event was fired. If the value didn't
                    // change it means that the user still enters the same
                    // word, hence we don't need to change the value.
                    if (foundTerm !== null && foundTerm.toLowerCase() !== userInput) {
                        var beforeCursor = inputValue.substr(0, curPos),
                            afterCursor  = inputValue.substr(curPos, inputValue.length),
                            curPosInWord = curPos - (inputValue.substr(0, curPos).lastIndexOf(' ') + 1);

                        // this is so bad i dont even know what to say. run.
                        if ((beforeCursor + afterCursor).toLowerCase().indexOf(foundTerm.toLowerCase()) > -1) {
                            return true
                        } 
                        if (foundTerm.toLowerCase().indexOf((beforeCursor + afterCursor).toLowerCase()) == 0)
                            var restOfTerm = foundTerm.substr((beforeCursor + afterCursor).length, foundTerm.length);    
                        else
                            var restOfTerm = foundTerm.substr(curPosInWord, foundTerm.length);
                        $inputElement.val(beforeCursor + restOfTerm + afterCursor);

                        $inputElement.__select(curPos, restOfTerm.length + curPos);
                    }
                }
            }

            return returnValue;
        }
    };

    $.fn.__select = function (startPos, endPos) {
        if (typeof startPos == 'number' && typeof endPos == 'number') {
            this.each(function () {
                var start;
                if (typeof this.selectionStart !== "undefined") {
                    this.selectionStart = startPos;
                    this.selectionEnd = endPos;
                }
                else {
                    var range = document.selection.createRange();
                    this.select();
                    var range2 = document.selection.createRange();

                    range2.setEndPoint("EndToStart", range);
                    start = range2.text.length;

                    this.select();
                    range = document.selection.createRange();
                    range.moveStart("character", start);
                    range.select();
                }
            });
        }

        return this;
    };

    $.fn.__getSelection = function() {
        var el = this.get(0);

        if (typeof el.selectionStart != 'undefined') {
            return this.val().substr(el.selectionStart, el.selectionEnd);
        } else {
            var range = document.selection.createRange();

            return range.text;
        }
    };

    $.fn.__moveSelectionStart = function(amount) {
        if (typeof amount == 'number') {
            this.each(function() {
                if (typeof this.selectionStart !== 'undefined') {
                    this.selectionStart += amount;
                } else { // ie
                    var range = document.selection.createRange();
                    range.moveStart("character", amount);
                    range.select();
                }
            });
        }
    };

    $.fn.__cursorPosition = function() {
        if (typeof this.get(0).selectionStart !== 'undefined') {
            return this.get(0).selectionStart;
        } else { // ie
            var range = document.selection.createRange();
            range.moveStart("character", amount);
            range.select();
        }
    };

    /**
     * Register inlineComplete plugin. This enables you to use $('input').inlineComplete();
     *
     * In the options object you have to at least include a list of list you want have completion for.
     * The index for that list must be "list".

     * @param {Object} options
     */
    $.fn.inlineComplete = function (options) {
        this.filter('input[type=text], textarea').each(function (e) {
            var $this = $(this),
                instanceOptions = $.extend(true, {}, _inlineComplete._defaultOptions, options);

            if (instanceOptions.list.length == 0) {
                if ($this.data('list')) {
                    if ($this.data('list').indexOf('list') === 0) {
                        instanceOptions.list = $this.data('list').replace(/^list:/i, '').split('|');
                    }
                } else if(typeof $this.attr('list') != 'undefined') {
                    // HTML5 datalist
                    var $datalist = $('#' + $this.attr('list'));
                    if ($datalist.length > 0) {
                        if (_inlineComplete.dataListSupport) {
                            // Use JavaScript/DOM accessor when datalist element
                            // is supported by the browser.

                            var datalistOptions = $datalist.get(0).options;
                            for(var i in datalistOptions) {
                                if (datalistOptions[i].value) {
                                    instanceOptions.list.push(datalistOptions[i].value);
                                }
                            }
                        } else {
                            // "Manually" access the value attribute if the
                            // browser doesn't support datalists.

                            instanceOptions.list = [];
                            $datalist.find('option').each(function() {
                                instanceOptions.list.push($this.attr('value'));
                            });
                        }

                        if (instanceOptions.disableDataList) {
                            $this.removeAttr('list');
                        }
                    }
                }
            }


            $this.on('keyup keydown', function (e) {
                return _inlineComplete._performComplete($this, e);
            });

            $this.data('termList', instanceOptions.list)

            return true;
        });

        return this;
    };
})(jQuery);
