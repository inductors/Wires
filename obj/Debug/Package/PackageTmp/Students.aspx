<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Student.aspx.cs" Inherits="WebApplication1.Student" %>

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
    <style type="text/css">
        .style1
        {
            font-family: Arial, Helvetica, sans-serif;
        }
    </style>
</head>
<body>

<!-- This is the jquery AJAX callback to run the C# LoadCircuit function from Students.aspx.cs, 
then the JS deserialize function from board.js
-->
<form id="serial" runat="server">
    <div>
    <span class="style1"><strong>Student Name:</strong></span>  <input type="text" id="txtName" />    
      <input type="button" name="myotherbutton" value="Save Progress" id="logBut" />
    </div>

    <div>
      <asp:DropDownList ID="DropDownList1" runat="server" 
        DataSourceID="SqlDataSource3" DataTextField="CircuitName" 
        DataValueField="CircuitName" 
        onselectedindexchanged="DropDownList1_SelectedIndexChanged">
      </asp:DropDownList>
      <input type="button" name="mybutton" value="Load Circuit" id="mybutton" />
      

    <script type="text/javascript">
        //capture the value of the selection box so we can post it

        //make the callback
        $('#mybutton').on('click', function () {
            var dataOut = 'data=' + $('#DropDownList1 option:selected').val();
            //  alert("Button clicked");
            $.ajax({
                url: '/loader.aspx',
                method: 'post',
                data: dataOut,
                success: function (returned) {
                    $('#serialText').val(returned);
                    $('#tool_load').click();
                },
                error: function () { alert("Callback Failed") }
            });
        });


    </script>
    
    </div>



    <asp:SqlDataSource ID="SqlDataSource2" runat="server" 
        ConnectionString="<%$ ConnectionStrings:tutorDBConnectionString %>" 
        onselecting="SqlDataSource2_Selecting" 
        SelectCommand="SELECT [CircuitData] FROM [Circuits] WHERE ([CircuitName] = @CircuitName)">
        <SelectParameters>
            <asp:ControlParameter ControlID="DropDownList1" Name="CircuitName" 
                PropertyName="SelectedValue" Type="String" />

    </SelectParameters>
    </asp:SqlDataSource>

    <asp:SqlDataSource ID="SqlDataSource1" runat="server" 
        ConnectionString="<%$ ConnectionStrings:tutorDBConnectionString %>" 
        SelectCommand="SELECT * FROM [Circuits]"></asp:SqlDataSource>
    <asp:SqlDataSource ID="SqlDataSource3" runat="server" 
        ConnectionString="<%$ ConnectionStrings:DB_42065_tutordbConnectionString %>" 
        SelectCommand="SELECT * FROM [Circuits]"></asp:SqlDataSource>

 

        <div id="ui">
      <div id="tools">
          <h3>Tools</h3>
          <ul id="selected_elems"></ul>
      </div>
      <canvas id="board" width="800" height="600"></canvas>
      <div id="sidepanel">
        <h3>Options</h3>
        <div id="options">
            <input type="checkbox" id="snap" />Snap
        </div>
        <hr/>
        <h3>Actions</h3>
        <div id="actions">
        </div>
        <hr/>
        <h3>Reductions</h3>
        <div id="reductions">
        </div>
        <hr/>
        <h3>Selected</h3>
        <div id="selectedinfo">
        </div>
      </div>
      <br />

            
        <input type="hidden" name="serialdata" style="height: 25px; width: 168px" 
            id="serialText" />
     
        
        
    </div>


    <p>

    </p>


    <div>
     &nbsp;<script type="text/javascript">
               //capture the value of the selection box so we can post it

               //make the callback
               $('#logBut').on('click', function () {
                   $('#tool_save').click();
                   var dataOut = 'id=' + $('#DropDownList1 option:selected').val() + ' &name=' + $('#txtName').val() + ' &data=' + $('#serialText').val();
                   $.ajax({
                       url: '/logger.aspx',
                       method: 'post',
                       data: dataOut,
                       success: function (returned) { alert(returned) },
                       error: function () { alert("Callback Failed") }
                   });
               });


    </script></div>
    
    
    </div>
    
    
    
    </div>
    </form>

    

</body>
</html>


