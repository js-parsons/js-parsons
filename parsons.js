(function() { // wrap in anonymous function to not show some helper variables
var ParsonsWidget = function(options) {
    this.modified_lines = [];
    this.extra_lines = [];
    this.model_solution = [];

    //To collect statistics, feedback should not be based on this
    this.user_actions = [];
    
    var defaults = { 
            'incorrectSound': false,
            'x_indent': 50,
            'feedback_cb': false,
            'first_error_only': true,
            'max_wrong_lines': 10,
            'trash_label': 'Drag from here',
            'solution_label': 'Construct your solution here'
    };
    
    this.options = jQuery.extend({}, defaults, options);
    this.feedback_exists = false;
    this.FEEDBACK_STYLES = { 'correctPosition' : 'correctPosition',
            'incorrectPosition' : 'incorrectPosition',
            'correctIndent' : 'correctIndent',
            'incorrectIndent' : 'incorrectIndent'};
};

// regexp used for trimming
var trimRegexp = /^\s*(.*?)\s*$/;

//Public methods

ParsonsWidget.prototype.parseLine = function(spacePrefixedLine) {
    return {
	code: spacePrefixedLine.replace(trimRegexp, "$1").replace(/\\n/,"\n"),
	indent: spacePrefixedLine.length - spacePrefixedLine.replace(/^\s+/,"").length
    };
}

ParsonsWidget.prototype.parseCode = function(lines, max_distractors) {
    var distractors = [],
    indented = [],
    widgetData = [],
    lineObject,
    errors = [],
    that = this;   
    $.each(lines, function(index, item) {
	    if (item.search(/#distractor\s*$/) >= 0) {
		lineObject = { 
		    code: item.replace(/#distractor\s*$/,"").replace(trimRegexp, "$1").replace(/\\n/,"\n"),
		    indent: -1,
		    distractor: true,
		    orig: index
		};
		if (lineObject.code.length > 0) {
		    distractors.push(lineObject);
		}
	    } else {
		lineObject = that.parseLine(item);
		if (lineObject.code.length > 0) {
		    lineObject.distractor = false;
		    lineObject.orig = index;     
		    indented.push(lineObject);
		}
	    }    
	});
    
    // Normalize indents and make sure indentation is valid
    var normalized = this.normalizeIndents(indented);
    
    $.each(normalized, function(index, item) {
	    if (item.indent < 0) {
		errors.push("Line " + normalized.orig + " is not correctly indented. No matching indentation."); 
	    }
	    widgetData.push(item);
        });
    
    // Remove extra distractors
    permutation = this.getRandomPermutation(distractors.length)
    var selected_distractors = []
    for (var i = 0; i < max_distractors; i++) {
	selected_distractors.push(distractors[permutation[i]]);
	widgetData.push(distractors[permutation[i]]);
    }
    
    return {
	solution:  $.extend(true, [], normalized),
        distractors: $.extend(true, [], selected_distractors),
        widgetInitial: $.extend(true, [], widgetData),
        errors: errors};
};

ParsonsWidget.prototype.init = function(text) {
    var initial_structures = this.parseCode(text.split("\n"), this.options.max_wrong_lines);
    this.model_solution = initial_structures.solution;
    this.extra_lines = initial_structures.distractors;
    this.modified_lines = initial_structures.widgetInitial;

    $.each(this.modified_lines, function(index, item) {
	    item.id = 'codeline' + index;
	    item.indent = 0;
        });

};

ParsonsWidget.prototype.addLogEntry = function(entry, extend) {
    var logData = {};
    if (entry && !extend) {
        this.user_actions.push(entry);
    } else {
        if (this.options.trashId) {
            logData = {
                time: new Date(),
                output: jQuery.extend(true, [], this.getModifiedCode("#ul-" + this.options.sortableId)),
                input: jQuery.extend(true, [], this.getModifiedCode("#ul-" + this.options.trashId)),
                type: "action"
            };
        } else {
            logData = {
                time: new Date(),
                output: jQuery.extend(true, [], this.getModifiedCode("#ul-" + this.options.sortableId)),
                type: "action"
            };
        }
        if (entry && extend) {
          jQuery.extend(logData, entry);
        }
        this.user_actions.push(logData);
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
                return normalized[i].indent;
            }
        }
        return -1;
    };
    for ( var i = 0; i < lines.length; i++ ) {
        //create shallow copy from the line object
        new_line = jQuery.extend({}, lines[i]);
        if (i === 0) {
            new_line.indent = 0;
            if (lines[i].indent !== 0) {
              new_line.indent = -1;
            }
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
    var errors = [], log_errors = [];
    
    var lines = _.map(student_code, function(line) {
      return parseInt(line.id.substring(8), 10);
    });
    var inv = LIS.best_lise_inverse(lines);
    var incorrectLines = [];
    _.each(inv, function(itemId) {
      $("#codeline" + itemId).addClass("incorrectPosition");
      incorrectLines.push(itemId);
    });
    if (inv.length > 0) {
      errors.push("Some lines in incorrect position relative to others");
      log_errors.push({type: "incorrectPosition", lines: incorrectLines});
    }
    
    // Always show this feedback
    if (this.model_solution.length < student_code.length) {
        $("#ul-" + this.options.sortableId).addClass("incorrect");
        errors.push("Too many lines in your solution");
        log_errors.push({type: "tooManyLines", lines: student_code.length});
    } else if (this.model_solution.length > student_code.length){
        $("#ul-" + this.options.sortableId).addClass("incorrect");
        errors.push("Too few lines in your solution");
        log_errors.push({type: "tooFewLines", lines: student_code.length});
    }
    
    if (errors.length == 0) { // check indent if no other errors
      for (var i = 0; i < lines_to_check; i++) {
        var code_line = student_code[i];
        var model_line = this.model_solution[i];
        // need to uncomment following if distractors are added back!!
        /*if (code_line.code !== model_line.code && 
                ((!this.options.first_error_only) || errors.length == 0)) {
            $("#" + code_line.id).addClass("incorrectPosition");
            errors.push("line " + (i+1) + " is not correct!");
            log_errors.push({type: "incorrectPosition", line: (i+1)});
        }*/
        if (code_line.indent !== model_line.indent && 
                ((!this.options.first_error_only) || errors.length == 0)) {
            $("#" + code_line.id).addClass("incorrectIndent");
            errors.push("line " + (i+1) + " is not indented correctly");
            log_errors.push({type: "incorrectIndent", line: (i+1)});
        }
        if (code_line.code == model_line.code &&
            code_line.indent == model_line.indent &&
            errors.length == 0) {
            $("#" + code_line.id).addClass("correctPosition");
        }
      }
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
    this.addLogEntry({type: "feedback", errors: log_errors}, true);
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

ParsonsWidget.prototype.getFixedPermutation = function(n) {
    var permutation = [];
    var i;
    for (i = 0; i < n; i++) {
        permutation.push(i);
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
        var initial_state = []; //used only for logging
                
        var that = this;
        for (var i=0; i<this.modified_lines.length; i++) {
            codelines.push('<li id="codeline' + i + '" class="prettyprint lang-py">' + this.modified_lines[i].code + '<\/li>');
        }
                
        //randomize is a permutation array, i.e. array with index values where [1, 2, ..., n] implies nothing is permutated
        if (randomizeCallback) {
            var permutation = randomizeCallback(codelines.length);
            var randomized_lines = [];
            for (i = 0; i < codelines.length; i++) {
                randomized_lines[i] = codelines[permutation[i]];
                initial_state[i] = this.modified_lines[permutation[i]];
            }
            codelines = randomized_lines;
        } else {
          initial_state = this.modified_lines;
        }

        this.addLogEntry({type: 'init', time: new Date(), initial: initial_state});
    
        if (this.options.trashId) {
            $("#" + this.options.trashId).html('<p>'+this.options.trash_label+'</p><ul id="ul-' + this.options.trashId + '">'+codelines.join('')+'</ul>');
            $("#" + this.options.sortableId).html('<p>'+this.options.solution_label+'</p><ul id="ul-' + this.options.sortableId + '"></ul>');            
        } else {
            var d = $("#" + this.options.sortableId);
            var h = '<ul id="ul-' + this.options.sortableId + '">'+codelines.join('')+'</ul>';
            $("#" + this.options.sortableId).html('<ul id="ul-' + this.options.sortableId + '">'+codelines.join('')+'</ul>');
        }
        if (window.prettyPrint && (typeof(this.options.prettyPrint) === "undefined" || this.options.prettyPrint)) {
            prettyPrint(); //NOT IMPLEMENTET YET?
        }
        var sortable = $("#ul-" + this.options.sortableId).sortable({
            start : function() { that.clearFeedback(); },
            stop : function(event, ui) {
                if ($(event.target)[0] != ui.item.parent()[0]) {
                    return;
                }
                var ind = that.updateIndent(ui.position.left - ui.item.parent().offset().left,
                                        ui.item[0].id);
                ui.item.css("margin-left", that.options.x_indent * ind + "px");
                that.addLogEntry({type: "moveOutput", target: ui.item[0].id}, true); 
            },
            receive : function(event, ui) {
                var ind = that.updateIndent(ui.position.left - ui.item.parent().offset().left,
                                        ui.item[0].id);
                ui.item.css("margin-left", that.options.x_indent * ind + "px");
                that.addLogEntry({type: "addOutput", target: ui.item[0].id}, true); 
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
                    that.addLogEntry({type: "removeOutput", target: ui.item[0].id}, true); 
                },
                stop: function(event, ui) { 
                    if ($(event.target)[0] != ui.item.parent()[0]) {
                        // line moved to output and logged there
                        return;
                    }
                    that.addLogEntry({type: "moveInput", target: ui.item[0].id}, true); 
                }
            });
            sortable.sortable('option', 'connectWith', trash);
        }
    };
    window['ParsonsWidget'] = ParsonsWidget;
})();