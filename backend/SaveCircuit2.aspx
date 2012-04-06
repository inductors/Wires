<%@ Page Language="C#" AutoEventWireup="true" CodeFile="SaveCircuit2.aspx.cs" Inherits="SaveCircuit2" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title></title>
</head>
<body>
    <form id="form1" runat="server">
    <div>
    
    </div>
    <asp:FormView ID="FormView1" runat="server" DataKeyNames="CircuitID" 
        DataSourceID="SqlDataSource1" Width="382px">
        <EditItemTemplate>
            CircuitID:
            <asp:Label ID="CircuitIDLabel1" runat="server" 
                Text='<%# Eval("CircuitID") %>' />
            <br />
            CircuitDescription:
            <asp:TextBox ID="CircuitDescriptionTextBox" runat="server" 
                Text='<%# Bind("CircuitDescription") %>' />
            <br />
            <asp:LinkButton ID="UpdateButton" runat="server" CausesValidation="True" 
                CommandName="Update" Text="Update" />
            &nbsp;<asp:LinkButton ID="UpdateCancelButton" runat="server" 
                CausesValidation="False" CommandName="Cancel" Text="Cancel" />
        </EditItemTemplate>
        <InsertItemTemplate>
            CircuitID:
            <asp:TextBox ID="CircuitIDTextBox" runat="server" 
                Text='<%# Bind("CircuitID") %>' />
            <br />
            CircuitDescription:
            <asp:TextBox ID="CircuitDescriptionTextBox" runat="server" 
                Text='<%# Bind("CircuitDescription") %>' />
            <br />
            <asp:LinkButton ID="InsertButton" runat="server" CausesValidation="True" 
                CommandName="Insert" Text="Insert" />
            &nbsp;<asp:LinkButton ID="InsertCancelButton" runat="server" 
                CausesValidation="False" CommandName="Cancel" Text="Cancel" />
        </InsertItemTemplate>
        <ItemTemplate>
            CircuitID:
            <asp:Label ID="CircuitIDLabel" runat="server" Text='<%# Eval("CircuitID") %>' />
            <br />
            CircuitDescription:
            <asp:Label ID="CircuitDescriptionLabel" runat="server" 
                Text='<%# Bind("CircuitDescription") %>' />
            <br />
            <asp:LinkButton ID="EditButton" runat="server" CausesValidation="False" 
                CommandName="Edit" Text="Edit" />
            &nbsp;<asp:LinkButton ID="DeleteButton" runat="server" CausesValidation="False" 
                CommandName="Delete" Text="Delete" />
            &nbsp;<asp:LinkButton ID="NewButton" runat="server" CausesValidation="False" 
                CommandName="New" Text="New" />
        </ItemTemplate>
    </asp:FormView>
    <asp:SqlDataSource ID="SqlDataSource1" runat="server" 
        ConflictDetection="CompareAllValues" 
        ConnectionString="<%$ ConnectionStrings:tutorDBConnectionString1 %>" 
        DeleteCommand="DELETE FROM [Circuits] WHERE [CircuitID] = @original_CircuitID AND [CircuitDescription] = @original_CircuitDescription" 
        InsertCommand="INSERT INTO [Circuits] ([CircuitID], [CircuitDescription]) VALUES (@CircuitID, @CircuitDescription)" 
        OldValuesParameterFormatString="original_{0}" 
        SelectCommand="SELECT * FROM [Circuits]" 
        UpdateCommand="UPDATE [Circuits] SET [CircuitDescription] = @CircuitDescription WHERE [CircuitID] = @original_CircuitID AND [CircuitDescription] = @original_CircuitDescription">
        <DeleteParameters>
            <asp:Parameter Name="original_CircuitID" Type="String" />
            <asp:Parameter Name="original_CircuitDescription" Type="String" />
        </DeleteParameters>
        <InsertParameters>
            <asp:Parameter Name="CircuitID" Type="String" />
            <asp:Parameter Name="CircuitDescription" Type="String" />
        </InsertParameters>
        <UpdateParameters>
            <asp:Parameter Name="CircuitDescription" Type="String" />
            <asp:Parameter Name="original_CircuitID" Type="String" />
            <asp:Parameter Name="original_CircuitDescription" Type="String" />
        </UpdateParameters>
    </asp:SqlDataSource>
    <asp:GridView ID="GridView1" runat="server" AllowPaging="True" 
        AllowSorting="True" AutoGenerateColumns="False" DataKeyNames="CircuitID" 
        DataSourceID="SqlDataSource1" Width="1141px">
        <Columns>
            <asp:CommandField ShowEditButton="True" />
            <asp:BoundField DataField="CircuitID" HeaderText="CircuitID" ReadOnly="True" 
                SortExpression="CircuitID" />
            <asp:BoundField DataField="CircuitDescription" HeaderText="CircuitDescription" 
                SortExpression="CircuitDescription" />
        </Columns>
    </asp:GridView>
    </form>
</body>
</html>
