using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using System.Data.Sql;
using System.Configuration;
using System.Data.SqlClient;

namespace WebApplication1
{
    public partial class loader : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {

            //catch the value passed in by the url and pass it to LoadCircuit()
            var form = this.Request.Form;
            var postVal = Request.QueryString["data"];
            LoadCircuit(postVal);
        }

        protected void LoadCircuit(string ddText)
        {
            
            //Access the database and pull the selected circuit            
            SqlConnection connection = new SqlConnection("Data Source=s07.winhost.com;Initial Catalog=DB_42065_tutordb;User ID=DB_42065_tutordb_user;Password=tutor");
            SqlCommand cmd = new SqlCommand();
            cmd.Parameters.Add("@CircuitName", System.Data.SqlDbType.Text).Value = ddText;
            cmd.CommandText = "SELECT [CircuitData] FROM [Circuits] WHERE CircuitName LIKE @CircuitName";
            cmd.Connection = connection;
            connection.Open();
            SqlDataReader Read = cmd.ExecuteReader();
            Read.Read();
            string str = Read.GetString(0);
            connection.Close();

            Response.Write(str);
        }
      
    }
}