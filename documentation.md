---
layout: page
title: Documentation
permalink: /documentation/
---

Here will be the awesome js-parsons docs! This is still heavily under constructions, sorry about that!



## Getting started

The easiest way to get js-parsons is to download a zip file from the GitHub. You can find the latest version [here](https://github.com/vkaravir/js-parsons/archive/master.zip). Alternatively, if you are familiar with ```git```, you can clone the project like this:

    git clone https://github.com/vkaravir/js-parsons.git
    
That will clone the js-parsons project into subdirectory ```js-parsons``` in your current directory.

Both the zip file and the git cloning will give you exactly the same content. The important files and directories are:

 * ```examples/``` contains several example exercises on using the library
 * ```lib/``` libraries required by js-parsons
 * ```parsons.css``` and ```parsons.js``` the JavaScript and CSS files containing the actual library
 
You can open any of the examples in your browser and they should just work, there is nothing you need to build or anything.

### First Simple Exercise

Here's a skeleton of an HTML page with a Parsons problem:

```html

<!doctype html>
<html>
    <head>
        <title>Simple js-parsons example assignment</title>
        <link href="../parsons.css" rel="stylesheet" />
        <link href="../lib/prettify.css" rel="stylesheet" />
        <script src="../lib/prettify.js"></script>
    </head>
    <body>
        <!-- Here you'd include the assignment description... -->
        
        <!-- These are the elements which will include the lines of code -->
        <div id="jsparsons-source" class="sortable-code"></div>
        <div id="jsparsons-target" class="sortable-code"></div>
        
        <!-- Links to reset the assignment and to get feedback -->
        <p>
            <a href="#" id="newInstanceLink">New instance</a>
            <a href="#" id="feedbackLink">Get feedback</a>
        </p>
        
        <!-- Load the JavaScript files required -->
        <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script>
        <script src="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.18/jquery-ui.min.js"></script>
        <script src="../lib/underscore-min.js"></script>
        <script src="../lib/lis.js"></script>
        <script src="../parsons.js"></script>
        <script>
        // here comes the exercise definition JavaScript
        </script>
    </body>
</html>
```

## Line-based feedback

      * single area
      * two areas
      * adding distractors
      * can contain any code

## Variable check feedback
      * options for each test case
        * initCode (code executed before student code)
        * code (code executed after student code)
        * message (test description show to student
      * options
            * programmingLang
            * executableCode
            * vartests (array of stuff):
              * variables - object of varname - value pairs
              * initCode - executed before student code
              * code - executed after student code

## Unittest feedback

      * example exercise
      * how are the unittest exercises graded
      * options:
            * unittests
            * programmingLang
            * executableCode

## Different programming languages

      * pseudo specified
      * feedback on blocks
      * how to specify your own language
      * languagetranslationgrader basics
      * executable_code
      * how are the tests specified

         * either variable check or unittest


## Turtle graphics

      * what is turtle graphics
      * specifying an exercise
      * how is the grading done
      * options:
            * turtleTestCode
            * turtlePenDown
            * turtleModelCode
            * turtleModelCanvas
            * turtleStudentCanvas
            * programmingLang
            * executableCode
      * the turtle Python API

## Customizing the UI
## Logging and data collection

      * logged events




## Full list of options
