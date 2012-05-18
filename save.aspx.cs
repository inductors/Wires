using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using System.Data.SqlClient;

namespace WebApplication1
{
    public partial class save : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        protected void Button1_Click(object sender, EventArgs e)
        {
            String strID;
            String strName;
            String strText;
            String strDesc;
            strID = TB_ID.Text;
            strName = TB_Name.Text;
            strText = TB_Text.Text;
            strDesc = TB_Desc.Text;

            SqlDataSource1.Insert();
            
            //InsertCommand="INSERT INTO [Circuits] ([CircuitID], [CircuitName], [CircuitText], [CircuitDescription]) VALUES (' & strID & ', ' & strName & ', ' & strText & ', ' & strDesc & ');

            //TB_ID.Text = TB_Name.Text;
        }


    }
}