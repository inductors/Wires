<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="save.aspx.cs" Inherits="WebApplication1.save" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title></title>
</head>
<body>
    <form id="form1" runat="server">
    <br />
    <br />
    Problem ID&nbsp;&nbsp;(10 
    char max, unique)&nbsp;&nbsp;Problem Display Name&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 
    Problem Data&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Problem Description<br />
    <asp:TextBox ID="TB_ID" runat="server" Width="266px"></asp:TextBox>
    <asp:TextBox ID="TB_Name" runat="server" Width="200px"></asp:TextBox>
    <asp:TextBox ID="TB_Desc" runat="server"></asp:TextBox>
    <asp:TextBox ID="TB_Text" runat="server" Width="203px"></asp:TextBox>
    <asp:Button ID="B_Save" runat="server" onclick="Button1_Click" Text="Save" 
        Width="78px" />
    <asp:SqlDataSource ID="SqlDataSource1" runat="server" 
        ConnectionString="<%$ ConnectionStrings:tutorDBConnectionString %>" 
        SelectCommand="SELECT * FROM [Circuits]" 
        InsertCommand="INSERT INTO Circuits(CircuitID, CircuitData, CircuitName, CircuitText) VALUES (@CID, @CDesc, @CName, @CText)">
        <InsertParameters>
            <asp:ControlParameter ControlID="TB_Text" Name="CText" PropertyName="Text" />
            <asp:ControlParameter ControlID="TB_Desc" Name="CDesc" PropertyName="Text" />
            <asp:ControlParameter ControlID="TB_Name" Name="CName" PropertyName="Text" />
            <asp:ControlParameter ControlID="TB_ID" Name="CID" PropertyName="Text" />
        </InsertParameters>
        </asp:SqlDataSource>
    </form>
</body>
</html>
