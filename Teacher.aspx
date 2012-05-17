<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Teacher.aspx.cs" Inherits="WebApplication1.Teacher" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml">
<head id="Head1" runat="server">
    <script type="text/javascript" src="https://www.google.com/jsapi"></script>
    <script type="text/javascript">
        google.load("jquery", "1.7.0", { uncompressed: true });
        google.load("jqueryui", "1.8.16", { uncompressed: true });
    </script>
    <!--[if IE]><script type="text/javascript" src="excanvas.js"></script><![endif]-->
    <script type="text/javascript" src="/js/json2.js" charset="utf-8"></script>
    <script type="text/javascript" src="/js/functions.js" charset="utf-8"></script>
    <script type="text/javascript" src="/js/reductions.js" charset="utf-8"></script>
    <script type="text/javascript" src="/js/board.js" charset="utf-8"></script>
    <script type="text/javascript" src="/js/tools.js" charset="utf-8"></script>

    <link rel="stylesheet" type="text/css" href="/css/board.css" />
    <title></title>
</head>
<body>

<!-- This is the jquery AJAX callback to run the C# LoadCircuit function from Student.aspx.cs, 
then the JS deserialize function from board.js
-->
<form id="serial" runat="server">


    <div id="teacher_tools">
        <pre>
        Circuit ID (Must be Unique): <input type="text" id="txtID" />       
        Circuit Name:               <input type="text" id="txtName" />        
        Circuit Description:        <input type="text" id="txtComments" />
        </pre>
        <pre>
<input type="button" name="mybutton" value="Save Circuit" id="mybutton" /></pre>

    <div>
     &nbsp;<script type="text/javascript">
               //capture the value of the selection box so we can post it

               //make the callback
               $('#mybutton').on('click', function () {                   
                   $('#tool_save').click();
                   var dataOut = 'id=' + $('#txtID').val() + ' &name=' + $('#txtName').val() + ' &text=' + $('#txtComments').val() + ' &data=' + $('#serialText').val();
                   $.ajax({
                       url: '/saver.aspx',
                       method: 'post',
                       data: dataOut,
                       success: function (returned) { alert("Circuit Saved!") },
                       error: function () { alert("Callback Failed") }
                   });
               });


    </script></div>
    
    
    </div>

    <div id="ui">
      <div id="tools">
          <h3>Tools</h3>
          <ul id="selected_elems"></ul>
      </div>
      <canvas id="board" width="800" height="600"></canvas>
      <div id="sidepanel">
        <h3>Selected</h3>
        <div>
            <ul id="selectedinfo">
            </ul>
        </div>
        <hr>
        <h3>Options</h3>
        <div id="options">
            <input type="checkbox" id="snap" />Snap
        </div>
        <hr>
        <h3>Actions</h3>
        <div id="actions">
        </div>
        <hr>
        <h3>Reductions</h3>
        <div id="reductions">
        </div>
      </div>
      <br />
      
      
        <input type="hidden" name="serialdata" style="height: 25px; width: 168px" 
            id="serialText" />
     
        
        
    </div>


    <p>

    </p>
    </form>
    

</body>
</html>


