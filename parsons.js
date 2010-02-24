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
    function updateIndent(leftDiff, id) {
        var code_line = getLineById(id);
        var new_indent = code_line.indent + Math.floor(leftDiff / X_INDENT);
        new_indent = Math.max(0, new_indent);
        code_line.indent = new_indent;
        return new_indent;
    };
    function getLineById(id) {
        return modified_lines[getElemIndex(id)];
    }
    function getElemIndex(id) {
        for ( var i = 0; i < modified_lines.length; i++) {
            if (modified_lines[i].id == id) {
                return i;
            }
        }
    };

    function normalizeIndents(lines) {

        var normalized = [];
        var previous_indentation;
        var new_line;

        for ( var i = 0; i < lines.length; i++ ) {
            //create shallow copy from the line object
            new_line = jQuery.extend({}, lines[i]);
            if (i == 0) {
                new_line.indent = 0;
            } else if (lines[i].indent == lines[i-1].indent) {
                new_line.indent = normalized[i-1].indent;
            } else if (lines[i].indent > lines[i-1].indent) {
                new_line.indent = normalized[i-1].indent + 1;
            } else {
                // indentation van be -1 if no matching indentation exists, i.e. IndentationError in Python
                new_line.indent = function(index) {
                    //return line index from the previous lines with matchind indentation
                    for (var i = index-1; i >= 0; i--) {
                        if (lines[i].indent == lines[index].indent) {
                            return i;
                        }
                    }
                    return -1;
                }(i);                    
            }
            normalized[i] = new_line;
        }
        return normalized;
    };
    function getModifiedCode() {
        //ids of the the modified code
        var users_code_ids = $("#ul-" + options.sortableId).sortable('toArray');
        var lines_to_return = [];
        for ( var i = 0; i < users_code_ids.length; i++ ) {
            lines_to_return[i] = getLineById(users_code_ids[i]);
        }
        return lines_to_return;
    };
    
    function displayError(message) {
    	if (options.incorrectSound && $.sound) {
            $.sound.play(options.incorrectSound);
        }
    	alert(message);
    };
    
    function getFeedback() {
        feedback_exists = true;
        var student_code = normalizeIndents(getModifiedCode());
        var lines_to_check = Math.min(student_code.length, model_solution.length)
        
        for (var i = 0; i < lines_to_check; i++) {
            var code_line = student_code[i];
            var model_line = model_solution[i]
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
    function clearFeedback() {
        if (feedback_exists) {
            $("#ul-" + options.sortableId).removeClass("incorrect correct");
            var li_elements = $("#ul-" + options.sortableId + " li");
            $.each(FEEDBACK_STYLES, function(index, value) {
                li_elements.removeClass(value);
            });
        }
        feedback_exists = false;
    };
    function init() {
        var codelines = [];
        for (var i = 0; i < options.codeLines.length; i++) {
            modified_lines[i] = codeLine(options.codeLines[i], 'codeline' + i);
            modified_lines[i].indent = 0;
            if (modified_lines[i].indent < 0) {
                extra_lines.push(codeLine(options.codeLines[i]));
            } else {
                model_solution.push(codeLine(options.codeLines[i]));
            }
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
    };
    init();
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
    return {
        getFeedback : function() {
            getFeedback();
        },
        shuffleLines : function() {
            init();
        }
    };
};