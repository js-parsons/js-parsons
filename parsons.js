var ParsonsWidget = function(options) {
    this.modified_lines = [];
    this.extra_lines = [];
    this.model_solution = [];

    //To collect statistics, feedback should not be based on this
    this.user_actions = [];
    
    var defaults = { 
            'incorrectSound': false,
            'x_indent': 20,
            'feedback_cb': false,
            'first_error_only': true,
            'max_wrong_lines': 10,
            'trash_label': 'Drag from here',
            'solution_label': 'Construct your solution here'
    };
    
    this.options = jQuery.extend({}, defaults, options);
    this.feedback_exists = false;
    this.X_INDENT = options.xIndent || 20;
    this.FEEDBACK_STYLES = { 'correctPosition' : 'correctPosition',
            'incorrectPosition' : 'incorrectPosition',
            'correctIndent' : 'correctIndent',
            'incorrectIndent' : 'incorrectIndent'};
    
    var codeLine = function(table_row, id) {
        return {
            id: id,
            code: table_row[1],
            indent: table_row[0]
        };
    };
    
    var noise = 0;
	var skipped = 0;
    for (var i = 0; i < options.codeLines.length; i++) {
        if (options.codeLines[i][0] < 0) {
           noise++;
            if (noise > options.max_wrong_lines) {
                skipped++;
                continue;
            }
        }
        this.modified_lines.push(codeLine(options.codeLines[i], 'codeline' + i));
        //this.randomized_original[i] = codeLine(options.codeLines[i], 'codeline' + i);
        if (this.modified_lines[i-skipped].indent < 0) {
            this.extra_lines.push(codeLine(options.codeLines[i]));
        } else {
            this.model_solution.push(codeLine(options.codeLines[i]));
        }
        this.modified_lines[i-skipped].indent = 0;
    }
};


//Public methods

ParsonsWidget.prototype.addLogEntry = function(entry) {
    if (entry) {
        this.user_actions.push(entry);
    } else {
        if (this.options.trashId) {
            this.user_actions.push({
                time: new Date(),
                answer: jQuery.extend(true, [], this.getModifiedCode("#ul-" + this.options.sortableId)),
                trash: jQuery.extend(true, [], this.getModifiedCode("#ul-" + this.options.trashId))});
        } else {
            this.user_actions.push({
                time: new Date(),
                answer: jQuery.extend(true, [], this.getModifiedCode("#ul-" + this.options.sortableId))});
        }
    }
};

/**
 * Update indentation of a line based on new coordinates 
 * leftDiff horizontal difference from (before and after drag) in px
 ***/
ParsonsWidget.prototype.updateIndent = function(leftDiff, id) {
    var code_line = this.getLineById(id);
    var new_indent = code_line.indent + Math.floor(leftDiff / this.options.x_indent);
    new_indent = Math.max(0, new_indent);
    code_line.indent = new_indent;
    return new_indent;
};

/**
 * 
 * @param id
 * @return
 */
ParsonsWidget.prototype.getLineById = function(id) {
    var index = -1;
    for (var i = 0; i < this.modified_lines.length; i++) {
        if (this.modified_lines[i].id == id) {
            index = i;
            break;
        }
    }
    return this.modified_lines[index];
};

/** Does not use the current object - only the argument */
ParsonsWidget.prototype.normalizeIndents = function(lines) {

    var normalized = [];
    var new_line;
    var match_indent = function(index) {
        //return line index from the previous lines with matching indentation
        for (var i = index-1; i >= 0; i--) {
            if (lines[i].indent == lines[index].indent) {
                return i;
            }
        }
        return -1;
    };
    for ( var i = 0; i < lines.length; i++ ) {
        //create shallow copy from the line object
        new_line = jQuery.extend({}, lines[i]);
        if (i === 0) {
            new_line.indent = 0;
        } else if (lines[i].indent == lines[i-1].indent) {
            new_line.indent = normalized[i-1].indent;
        } else if (lines[i].indent > lines[i-1].indent) {
            new_line.indent = normalized[i-1].indent + 1;
        } else {
            // indentation can be -1 if no matching indentation exists, i.e. IndentationError in Python
            var index = match_indent(i);
            if (index < 0) {
                new_line.indent = -1;
            } else {
                new_line.indent = normalized[index].indent;
            }
        }
        normalized[i] = new_line;
    }
    return normalized;
};

/** 
 * Retrieve the code lines based on what is in the DOM 
 * 
 * TODO(petri) refactor to UI
 * */
ParsonsWidget.prototype.getModifiedCode = function(search_string) {
    //ids of the the modified code
    var users_code_ids = $(search_string).sortable('toArray');
    var lines_to_return = [];
    for ( var i = 0; i < users_code_ids.length; i++ ) {
        lines_to_return[i] = this.getLineById(users_code_ids[i]);
    }
    return lines_to_return;
};


/**
 * TODO(petri) refoctor to UI
 */
ParsonsWidget.prototype.displayError = function(message) {
    if (this.options.incorrectSound && $.sound) {
        $.sound.play(this.options.incorrectSound);
    }
    alert(message);
};
/**
 * @return
 * TODO(petri): Separate UI from here
 */
ParsonsWidget.prototype.getFeedback = function() {
    this.feedback_exists = true;
    var student_code = this.normalizeIndents(this.getModifiedCode("#ul-" + this.options.sortableId));
    var lines_to_check = Math.min(student_code.length, this.model_solution.length);
    var errors = [];
    
    for (var i = 0; i < lines_to_check; i++) {
        var code_line = student_code[i];
        var model_line = this.model_solution[i];
        if (code_line.code !== model_line.code && 
                ((!this.options.first_error_only) || errors.length == 0)) {
            $("#" + code_line.id).addClass("incorrectPosition");
            errors.push("line " + (i+1) + " is not correct!");
        }
        if (code_line.indent !== model_line.indent && 
                ((!this.options.first_error_only) || errors.length == 0)) {
            $("#" + code_line.id).addClass("incorrectIndent");
            errors.push("line " + (i+1) + " is not indented correctly");
        }
        if (code_line.code == model_line.code &&
            code_line.indent == model_line.indent &&
            errors.length == 0) {
            $("#" + code_line.id).addClass("correctPosition");
        }
    }
    
    // Always show this feedback
    if (this.model_solution.length < student_code.length) {
        $("#ul-" + this.options.sortableId).addClass("incorrect");
        errors.push("Too many lines in your solution");
    } else if (this.model_solution.length > student_code.length){
        $("#ul-" + this.options.sortableId).addClass("incorrect");
        errors.push("Too few lines in your solution");
    }        
    
    if (errors.length == 0) {
        if (this.options.correctSound && $.sound) {
            $.sound.play(this.options.correctSound);
        }    
        $("#ul-" + this.options.sortableId).addClass("correct");
    }
    
    if (this.options.feedback_cb) {
        feedback_cb(); //TODO(petri): what is needed?
    }
    //alert("ok");
    return errors;
};

ParsonsWidget.prototype.clearFeedback = function() {
    if (this.feedback_exists) {
        $("#ul-" + this.options.sortableId).removeClass("incorrect correct");
        var li_elements = $("#ul-" + this.options.sortableId + " li");
        $.each(this.FEEDBACK_STYLES, function(index, value) {
            li_elements.removeClass(value);
        });
    }
    this.feedback_exists = false;
};


ParsonsWidget.prototype.getRandomPermutation = function(n) {
    var permutation = [];
    var i;
    for (i = 0; i < n; i++) {
        permutation.push(i);
    }
    var swap1, swap2, tmp;
    for (i = 0; i < n; i++) {
        swap1 = Math.floor(Math.random() * n);
        swap2 = Math.floor(Math.random() * n);
        tmp = permutation[swap1];
        permutation[swap1] = permutation[swap2];
        permutation[swap2] = tmp;
    }
    return permutation;
};

ParsonsWidget.prototype.shuffleLines = function() {
    this.createHtml(this.getRandomPermutation);
};

/** modifies the DOM by inserting exercise elements into it */
ParsonsWidget.prototype.createHtml = function(randomizeCallback) {
// TODO(petri): needs more refactoring
        var codelines = [];
                var initial_state = this.modified_lines; //used only for logging
                
        var that = this;
        for (var i=0; i<this.modified_lines.length; i++) {
            codelines.push('<li id="codeline' + i + '" class="prettyprint lang-py">' + this.modified_lines[i].code + '<\/li>');
        }
                
        //randomize is a permutation array, i.e. array with index values where [1, 2, ..., n] implies nothing is permutated
        if (randomizeCallback) {
            var permutation = randomizeCallback(codelines.length);
            var randomized_lines = [];
                        var randomized_initial = []; //used only for logging
            for (i = 0; i < codelines.length; i++) {
                randomized_lines[i] = codelines[permutation[i]];
                                randomized_initial = this.modified_lines[permutation[i]];
            }
                        initial_state = randomized_initial;
            codelines = randomized_lines;
        }
        this.addLogEntry({'time': new Date(), 'initial': initial_state});
    
        if (this.options.trashId) {
            $("#" + this.options.trashId).html('<p>'+this.options.trash_label+'</p><ul id="ul-' + this.options.trashId + '">'+codelines.join('')+'</ul>');
            $("#" + this.options.sortableId).html('<p>'+this.options.solution_label+'</p><ul id="ul-' + this.options.sortableId + '"></ul>');            
        } else {
            $("#" + this.options.sortableId).html('<ul id="ul-' + this.options.sortableId + '">'+codelines.join('')+'</ul>');
        }
        if (window.prettyPrint && (typeof(this.options.prettyPrint) === "undefined" || this.options.prettyPrint)) {
            prettyPrint(); //NOT IMPLEMENTET YET?
        }
        var sortable = $("#ul-" + this.options.sortableId).sortable({
            start : function() { that.clearFeedback(); },
            stop : function(event, ui) {
                if ($(event.target)[0] != ui.item.parent()[0]) {
                    that.addLogEntry();
                    return;
                }
                var ind = that.updateIndent(ui.position.left - ui.item.parent().offset().left,
                                        ui.item[0].id);
                ui.item.css("margin-left", that.options.x_indent * ind + "px");
                that.addLogEntry();
            },
            receive : function(event, ui) {
                var ind = that.updateIndent(ui.position.left - ui.item.parent().offset().left,
                                        ui.item[0].id);
                ui.item.css("margin-left", that.options.x_indent * ind + "px");
            },
            grid : [that.options.x_indent, 1 ]
        });
        if (this.options.trashId) {
            var trash = $("#ul-" + this.options.trashId).sortable({
                connectWith: sortable,
                start: function() { that.clearFeedback(); },
                receive: function(event, ui) {
                    that.getLineById(ui.item[0].id).indent = 0;
                    ui.item.css("margin-left", "0");
                },
                stop: function(event, ui) { 
                    that.addLogEntry(); 
                }
            });
            sortable.sortable('option', 'connectWith', trash);
        }
    };  


var parsons2d = function(options) {
    $ = jQuery;
    // options:
    //  - codeLines: codelines to be used, array with 0 includes indent and 1 the code
    //  - sortableId: id of the element where the codelines should be added
    //  - trashId: if two sets of codelines are used, this is where the additional lines should be
    //  - prettyPrint: if set to false, the highlighting of the code is not shown.
    //  - incorrectSound: relative url to a sound file which is played on error
    //  - correctSound: relative url to a sound file which is played when solved correctly
    //  - xIndent: width of one indent as a number of pixels, defaults to 50 
        var codeLine = function(table_row, id) {
                
                return {
                        id: id,
                        code: table_row[1],
                        indent: table_row[0]
                };
                                
                  
        };
        
    var feedback_exists = false;
    var modified_lines = [];
    var model_solution = [];
    var extra_lines = [];
    var X_INDENT = options.xIndent || 20;
    var FEEDBACK_STYLES = { 'correctPosition' : 'correctPosition',
            'incorrectPosition' : 'incorrectPosition',
            'correctIndent' : 'correctIndent',
            'incorrectIndent' : 'incorrectIndent'};
    var updateIndent = function(leftDiff, id) {
        var code_line = getLineById(id);
        var new_indent = code_line.indent + Math.floor(leftDiff / X_INDENT);
        new_indent = Math.max(0, new_indent);
        code_line.indent = new_indent;
        return new_indent;
    };
    var getElemIndex = function(id) {
        for ( var i = 0; i < modified_lines.length; i++) {
            if (modified_lines[i].id == id) {
                return i;
            }
        }
    };

    var getLineById = function(id) {
        return modified_lines[getElemIndex(id)];
    };

    var normalizeIndents = function(lines) {

        var normalized = [];
        var new_line;
        var match_indent = function(index) {
            //return line index from the previous lines with matchind indentation
            for (var i = index-1; i >= 0; i--) {
                if (lines[i].indent == lines[index].indent) {
                    return i;
                }
            }
            return -1;
        };
        for ( var i = 0; i < lines.length; i++ ) {
            //create shallow copy from the line object
            new_line = jQuery.extend({}, lines[i]);
            if (i === 0) {
                new_line.indent = 0;
            } else if (lines[i].indent == lines[i-1].indent) {
                new_line.indent = normalized[i-1].indent;
            } else if (lines[i].indent > lines[i-1].indent) {
                new_line.indent = normalized[i-1].indent + 1;
            } else {
                // indentation can be -1 if no matching indentation exists, i.e. IndentationError in Python
                new_line.indent = match_indent(i);                    
            }
            normalized[i] = new_line;
        }
        return normalized;
    };
    var getModifiedCode = function() {
        //ids of the the modified code
        var users_code_ids = $("#ul-" + options.sortableId).sortable('toArray');
        var lines_to_return = [];
        for ( var i = 0; i < users_code_ids.length; i++ ) {
            lines_to_return[i] = getLineById(users_code_ids[i]);
        }
        return lines_to_return;
    };
    
    var displayError = function(message) {
        if (options.incorrectSound && $.sound) {
            $.sound.play(options.incorrectSound);
        }
        alert(message);
    };
    
    var getFeedback = function() {
        feedback_exists = true;
        var student_code = normalizeIndents(getModifiedCode());
        var lines_to_check = Math.min(student_code.length, model_solution.length);
        
        for (var i = 0; i < lines_to_check; i++) {
            var code_line = student_code[i];
            var model_line = model_solution[i];
            if (code_line.code !== model_line.code) {
                $("#" + code_line.id).addClass("incorrectPosition");
                displayError("line " + (i+1) + " is not correct!");
                return;
            }
            if (code_line.indent !== model_line.indent) {
                $("#" + code_line.id).addClass("incorrectIndent");
                displayError("line " + (i+1) + " is not indented correctly");
                return;
            }
        }
        
        if (model_solution.length < student_code.length) {
            $("#ul-" + options.sortableId).addClass("incorrect");
            displayError("Too many lines in your solution");
            return;
        } else if (model_solution.length > student_code.length){
            $("#ul-" + options.sortableId).addClass("incorrect");
            displayError("Too few lines in your solution");
            return;
        }        
        
        if (options.correctSound && $.sound) {
            $.sound.play(options.correctSound);
        }
        
        $("#ul-" + options.sortableId).addClass("correct");
        alert("ok");
    };
    var clearFeedback = function() {
        if (feedback_exists) {
            $("#ul-" + options.sortableId).removeClass("incorrect correct");
            var li_elements = $("#ul-" + options.sortableId + " li");
            $.each(FEEDBACK_STYLES, function(index, value) {
                li_elements.removeClass(value);
            });
        }
        feedback_exists = false;
    };
    var init = function() {
        var codelines = [];
        for (var i = 0; i < options.codeLines.length; i++) {
            modified_lines[i] = codeLine(options.codeLines[i], 'codeline' + i);
            if (modified_lines[i].indent < 0) {
                extra_lines.push(codeLine(options.codeLines[i]));
            } else {
                model_solution.push(codeLine(options.codeLines[i]));
            }
            modified_lines[i].indent = 0;
            codelines[i] = '<li id="codeline' + i + '" class="prettyprint lang-py">' + modified_lines[i].code + '<\/li>';
        }
        var swap1, swap2, tmp;
        for (i = options.codeLines.length*2; i > 0; i--) {
            swap1 = Math.floor(Math.random() * options.codeLines.length);
            swap2 = Math.floor(Math.random() * options.codeLines.length);
            tmp = codelines[swap1];
            codelines[swap1] = codelines[swap2];
            codelines[swap2] = tmp;
        }
        if (options.trashId) {
            $("#" + options.trashId).html('<p>Trash</p><ul id="ul-' + options.trashId + '">'+codelines.join('')+'</ul>');
            $("#" + options.sortableId).html('<p>Solution</p><ul id="ul-' + options.sortableId + '"></ul>');            
        } else {
            $("#" + options.sortableId).html('<ul id="ul-' + options.sortableId + '">'+codelines.join('')+'</ul>');
        }
        if (typeof(options.prettyPrint) === "undefined" || options.prettyPrint) {
            prettyPrint();
        }
        var sortable = $("#ul-" + options.sortableId).sortable({
            start : clearFeedback,
            stop : function(event, ui) {
                if ($(event.target)[0] != ui.item.parent()[0]) {
                    return;
                }
                var ind = updateIndent(ui.position.left - ui.item.parent().offset().left,
                                        ui.item[0].id);
                ui.item.css("margin-left", X_INDENT * ind + "px");
            },
            receive : function(event, ui) {
                var ind = updateIndent(ui.position.left - ui.item.parent().offset().left,
                                        ui.item[0].id);
                ui.item.css("margin-left", X_INDENT * ind + "px");
            },
            grid : [ X_INDENT, 1 ]
        });
        if (options.trashId) {
            var trash = $("#ul-" + options.trashId).sortable({
                connectWith: sortable,
                start: clearFeedback,
                receive: function(event, ui) {
                    getLineById(ui.item[0].id).indent = 0;
                    ui.item.css("margin-left", "0");
                }
            });
            sortable.sortable('option', 'connectWith', trash);
        }
    };
    init();
    return {
        getFeedback : function() {
            getFeedback();
        },
        shuffleLines : function() {
            init();
        }
    };
};