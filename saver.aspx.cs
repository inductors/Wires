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
    public partial class saver : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {

            //catch the value passed in by the url and pass it to SaveCircuit()
            var form = this.Request.Form;
            var postID = Request.QueryString["id"];
            var postName = Request.QueryString["name"];
            var postText = Request.QueryString["text"];
            var postData = Request.QueryString["data"];

            //postID = "12345";
           // postName = "bob";
           // postText = "stuff";
            //postData = "not real";

            
            SaveCircuit(postID, postData, postName, postText);
        }

        protected void SaveCircuit(string cirID, string cirData, string cirName, string cirText)
        {

            //Access the database and perform the insert            
            SqlConnection connection = new SqlConnection("Data Source=tcp:s07.winhost.com;Initial Catalog=DB_42065_tutordb;User ID=DB_42065_tutordb_user;Password=tutor;Integrated Security=False;");
            SqlCommand cmd = new SqlCommand();
            cmd.Parameters.Add("@cirID", System.Data.SqlDbType.Text).Value = cirID;
            cmd.Parameters.Add("@cirData", System.Data.SqlDbType.Text).Value = cirData;
            cmd.Parameters.Add("@cirName", System.Data.SqlDbType.Text).Value = cirName;
            cmd.Parameters.Add("@cirText", System.Data.SqlDbType.Text).Value = cirText;
            cmd.CommandText = "INSERT INTO Circuits VALUES (@cirID, @cirData, @cirName, @cirText)";
            cmd.Connection = connection;
            connection.Open();
            int rows =cmd.ExecuteNonQuery();
            connection.Close();

            Response.Write(rows.ToString());
            
        }

    }
}