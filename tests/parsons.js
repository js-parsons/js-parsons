var assertCodeEquals = function(lines1, lines2) {
    equal(lines1.length, lines2.length);
};

// codelines in array2 may have extra features
var assertCodesEqual = function(code1, code2, message) {
    equal(code1.length, code2.length);
    for (var i=0; i<code1.length; i++) {
	equal(code1[i].code, code2[i].code, message + ' code of line ' + i );
	equal(code1[i].indent, code2[i].indent, message + ' indentation of line ' + i);
    }
};

module("Utilities");

test("getRandomPermutation()", function() {
    var initial = [[0, 'foo'],
		   [1, 'bar']];                                    
    var parson = new ParsonsWidget( {'codeLines': initial,
				     'sortableId': 'main'});
    var perm = parson.getRandomPermutation(2);
    equal(perm.length,2);
    ok( (perm[0] == 0 && perm[1] == 1) || (perm[0] == 1 && perm[1] == 0) );    
    });

test("normalizeIndents()", function() {
    var codeLine = function(elem, index) { return {'indent': elem}; };
    var initial = [[0, 'foo'],
		   [1, 'bar']];                                    
    var parson = new ParsonsWidget( {'codeLines': initial,
				     'sortableId': 'main'});
    var perm = parson.getRandomPermutation(2);
    deepEqual(
	      parson.normalizeIndents(jQuery.map([0, 1, 2, 1], codeLine)),	
	      jQuery.map([0, 1, 2, 1], codeLine),
	      "already normalized");
    deepEqual(
	      parson.normalizeIndents(jQuery.map([0, 1, 2, 2, 1, 2, 0], codeLine)),	
	      jQuery.map([0, 1, 2, 2, 1, 2, 0], codeLine),
	      "already normalized");
    deepEqual(
	      parson.normalizeIndents(jQuery.map([0, 4, 5, 4], codeLine)),	
	      jQuery.map([0, 1, 2, 1], codeLine),
	      "too much indented");
    deepEqual(
	      parson.normalizeIndents(jQuery.map([0, 4, 5, 3], codeLine)),	
	      jQuery.map([0, 1, 2, -1], codeLine),
	      "no matching indentation");
    deepEqual(
	      parson.normalizeIndents(jQuery.map([1, 1], codeLine))[0],	
	      codeLine(-1,0),
	      "first item should not be indented");			
    });	

module("Initialization of the widget");

test("internal data structures", function() {
    var initial = 
	'def traverse_in_order(binary_node):\n' +
	'  if binary_node:\n' +
        '  if not binary_node: #distractor\n' +
	'    foo\n' +
	'  foo-1\n';                                    
    var parson = new ParsonsWidget( {'sortableId': 'main'});
    parson.init(initial);

	//parson.createHtml();
    
    assertCodesEqual(parson.model_solution, [{'code': 'def traverse_in_order(binary_node):', 'indent':0},  
					     {'code': 'if binary_node:', 'indent':1},
					     {'code': 'foo', 'indent':2},
					     {'code': 'foo-1', 'indent':1}], 'model solution');
    assertCodesEqual(parson.extra_lines, [{'code': 'if not binary_node:', 'indent':-1},], 'distractors');
    
    //distractors are moved to the end
    assertCodesEqual(parson.modified_lines, [{'code': 'def traverse_in_order(binary_node):', 'indent':0},  
					     {'code': 'if binary_node:', 'indent':0},
					     {'code': 'foo', 'indent':0},
					     {'code': 'foo-1', 'indent':0},
					     {'code': 'if not binary_node:', 'indent':0},]);

    });


	
test("items in the sortable list (no distractors)", function() {
    var initial = 
	'def hello(name):\n' +
	'  print name\n';
    var parson = new ParsonsWidget({'sortableId': 'main'});
    parson.init(initial);
    parson.createHtml();      
    
    var optionTexts = [];
    $("#main ul li").each(function() { optionTexts.push($(this).text()) });
    
    deepEqual(optionTexts.sort(), ['def hello(name):', 'print name'], 'li elements should contain the codelines');
    });

test("items in the sortable list (distractors)", function() {
    var initial = 
	'def hello(name):\n' +
	'  print name\n' + 
	'  xxx #distractor\n';
    var parson = new ParsonsWidget({'sortableId': 'main', 
				    'max_wrong_lines': 1});
    parson.init(initial);
    parson.shuffleLines();      
    
    var optionTexts = [];
    $("#main ul li").each(function() { optionTexts.push($(this).text()) });
    
    deepEqual(optionTexts.sort(), ['def hello(name):', 'print name', 'xxx'], 'li elements should contain the codelines');
    });

                                         
module("Feedback");


//TODO: fix tests or remove

test("Everything ok", function() {
    var permutation = function(n) {return [0, 1];};
    var initial = 
	'foo\n' +
	'bar\n';
    var parson = new ParsonsWidget({'sortableId': 'main', 
				    'max_wrong_lines': 1});
    parson.init(initial);
    parson.createHtml(permutation);      

    equal(parson.getFeedback().length, 0);
    });                                 

test("Wrong order", function() {
    var permutation = function(n) {return [1, 0];};
    var initial = 
	'foo\n' +
	'bar\n';
    var parson = new ParsonsWidget({'sortableId': 'main', 
				    'max_wrong_lines': 1});
    parson.init(initial);
    parson.createHtml(permutation);      

    ok(parson.getFeedback().length > 0, 'there should be some feedback');
    });                                 


