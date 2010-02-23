var parsons2d = function(options) {
	this.options = options;
        //
	var modified_lines = [];
	var X_INDENT = options.xIndent || 50;
	function updateIndent(leftDiff, id) {
            var code_line = getLineById(id);
            var new_indent = code_line.indent
                + Math.floor(leftDiff / X_INDENT);
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
                } else if (lines[i].indent == lines[i-i].indent) {
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
            var users_code_ids = $("#" + this.options.sortableId).sortable('toArray');
            var lines_to_return = [];
            for ( var i = 0; i < users_code_ids.length; i++ ) {
                lines_to_return[i] = getLineById(users_code_ids[i]);
            }
            return lines_to_return;
        }

        function getFeedback() {
            var student_code = normalizeIndents(getModifiedCode());

            for (var i = 0; i < student_code.length; i++) {
                var code_line = student_code[i];
                if (code_line.code !== options.codeLines[i][1]) {
                    alert("line " + (i+1) + " is not correct!");
                    return;
                }
                if (code_line.indent !== this.options.codeLines[i][0]) {                    
                    alert("line " + (i+1) + " is not indented correctly");
                    return;
                }
            }
//             //ids of the the modified code
//             var usersCode = $("#" + this.options.sortableId).sortable('toArray');
//             for ( var i = 0; i < modified_lines.length; i++) {
//                 var code_line = getLineById(usersCode[i]);
//                 if (modified_lines[i].code !== code_line.code) {
//                     alert("line " + (i+1) + " is not correct!");
//                     return;
//                 }
//                 if (modified_lines[i].indent !== this.options.codeLines[i][0]) {
                    
//                     alert("line " + (i+1) + " is not indented correctly");
//                     return;
//                 }                
//             }
            alert("ok");
        };
	function init() {
		var codelines = [];
		if (typeof(options.codeLines) === "string") {
			codelines = options.codeLines.split('\n');
			for (var i = 0; i < codelines.length; i++) {
				modified_lines[i] = {
						'indent' : 0,
						'code' : codelines[i],
						'id' : 'codeline' + i
				};
				codelines[i] = '<li id="codeline' + i + '">' + codelines[i] + '<\/li>';
			}
		} else {
			for (var i = 0; i < options.codeLines.length; i++) {
				modified_lines[i] = {
						'indent' : 0,
						'code' : options.codeLines[i][1],
						'id' : 'codeline' + i
				};
				codelines[i] = '<li id="codeline' + i + '">' + options.codeLines[i][1] + '<\/li>';
			}
		}
		var swap1, swap2, tmp;
		for (i = options.codeLines.length*2; i > 0; i--) {
			swap1 = Math.floor(Math.random() * options.codeLines.length);
			swap2 = Math.floor(Math.random() * options.codeLines.length);
			tmp = codelines[swap1];
			codelines[swap1] = codelines[swap2];
			codelines[swap2] = tmp;
		}
		$("#" + this.options.sortableId).html(codelines.join(''));
	};
	init();
	$('#sortable').sortable(
			{
				stop : function(event, ui) {
					var parentLeft = ui.item.parent().position().left;
					var lineLeft = ui.item.offset().left;
					var ind = updateIndent(ui.position.left - ui.item.parent().offset().left,
                                                               ui.item[0].id);
					ui.item.css("margin-left", X_INDENT * ind + "px");
				},
				grid : [ X_INDENT, 1 ]
			});
	return {
		getFeedback : function() {
			 getFeedback();
		},
		shuffleLines : function() {
			 init();
		}
	};

        
};