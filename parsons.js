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
        function getFeedback() {
            var usersCode = $("#" + this.options.sortableId).sortable('toArray');
            for ( var i = 0; i < modified_lines.length; i++) {
                var code_line = getLineById(usersCode[i]);
                if (modified_lines[i].code !== code_line.code) {
                    alert("line " + (i+1) + " is not correct!");
                    return;
                }
                if (modified_lines[i].indent !== this.options.codeLines[i][0]) {
                    alert("line " + (i+1) + " is not indented correctly");
                    return;
                }                
            }
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
				codelines[i] = '<li id="codeline' + i + '" class="prettyprint lang-py">' + codelines[i] + '<\/li>';
			}
		} else {
			for (var i = 0; i < options.codeLines.length; i++) {
				modified_lines[i] = {
						'indent' : 0,
						'code' : options.codeLines[i][1],
						'id' : 'codeline' + i
				};
				codelines[i] = '<li id="codeline' + i + '" class="prettyprint lang-py">' + options.codeLines[i][1] + '<\/li>';
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