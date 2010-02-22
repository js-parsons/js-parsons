var parsons2d = function(options) {
	this.options = options;
	var indents = [];
	var X_INDENT = options.xIndent || 50;
	function getIndent(leftDiff, index) {
		var new_indent = indents[index].indent
				+ Math.floor(leftDiff / X_INDENT);
		indents[index].indent = new_indent;
		return new_indent;
	};
	function getElemIndex(elem) {
		for ( var i = 0; i < indents.length; i++) {
			if (indents[i].id == elem.id) {
				return i;
			}
		}
	};
	function init() {
		var codelines = [];
		for (var i = 0; i < options.codeLines.length; i++) {
			indents[i] = {
					'indent' : 0,
					'code' : options.codeLines[i][1],
					'id' : 'codeline' + i
			};
			codelines[i] = '<li id="codeline' + i + '">' + options.codeLines[i][1] + '<\/li>';
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
					var ind = getIndent(ui.position.left
							- ui.item.parent().offset().left,
							getElemIndex(ui.item[0]));
					ui.item.css("margin-left", X_INDENT * ind + "px");
				},
				grid : [ X_INDENT, 1 ]
			});
	return {
		getFeedback : function() {
			 alert("feedback");
		},
		shuffleLines : function() {
			 init();
		}
	};
};