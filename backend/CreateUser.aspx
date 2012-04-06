<%@ Page Language="C#" AutoEventWireup="true" CodeFile="CreateUser.aspx.cs" Inherits="CreateUser" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title></title>
</head>
<body>
    <form id="form1" runat="server">
    <div>
    
    </div>
    <div style="margin-left: 480px">
        <asp:CreateUserWizard ID="CreateUserWizard1" runat="server" BackColor="#FFFBD6" 
            BorderColor="#FFDFAD" BorderStyle="Solid" BorderWidth="1px" 
            Font-Names="Verdana" Font-Size="0.8em">
            <ContinueButtonStyle BackColor="White" BorderColor="#CC9966" 
                BorderStyle="Solid" BorderWidth="1px" Font-Names="Verdana" 
                ForeColor="#990000" />
            <CreateUserButtonStyle BackColor="White" BorderColor="#CC9966" 
                BorderStyle="Solid" BorderWidth="1px" Font-Names="Verdana" 
                ForeColor="#990000" />
            <TitleTextStyle BackColor="#990000" Font-Bold="True" ForeColor="White" />
            <WizardSteps>
                <asp:CreateUserWizardStep runat="server" />
                <asp:CompleteWizardStep runat="server" />
            </WizardSteps>
            <HeaderStyle BackColor="#FFCC66" BorderColor="#FFFBD6" BorderStyle="Solid" 
                BorderWidth="2px" Font-Bold="True" Font-Size="0.9em" ForeColor="#333333" 
                HorizontalAlign="Center" />
            <NavigationButtonStyle BackColor="White" BorderColor="#CC9966" 
                BorderStyle="Solid" BorderWidth="1px" Font-Names="Verdana" 
                ForeColor="#990000" />
            <SideBarButtonStyle ForeColor="White" />
            <SideBarStyle BackColor="#990000" Font-Size="0.9em" VerticalAlign="Top" />
        </asp:CreateUserWizard>
    </div>
    </form>
</body>
</html>
