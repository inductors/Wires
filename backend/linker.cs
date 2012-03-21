using System;
using System.Web;
using System.Web.UI;
using System.Data;
using System.Data.SqlClient;

namespace TutorBackend
{
    public static class Linker
    {	
		/// <remarks>
		/// A lot of this is reused code that sets up the generic bits of the connection,
		/// and lays out the template for adding new commands. 
		/// This is a butchered version of the original code modified to work with the current
		/// incarnation of the front end and revised version of the database, as of 3/21/12
		/// </remarks>
        /// <summary>
        /// Moves data between the GUI host and the SQL database.
        /// </summary>
        /// <param name="connectionString">
        /// A <see cref="System.String"/> that contains the sql connection parameters
        /// </param>
        /// <returns>
        /// A <see cref="SqlConnection"/> 
        /// </returns>
        public static SqlConnection GetConnection(string connectionString)
        {
            SqlConnection connection = null;
            try
            {
                connection = new SqlConnection(connectionString);
                connection.Open();
            }
            catch (Exception ex)
            {
                //if we have an error log it will go here

                if (connection != null)
                {
                    connection.Dispose();
                }
            }
            return connection;
        }

        /// <summary>
        /// Creates a sqlcommand
        /// </summary>
        /// <param name="connection">
        /// A <see cref="SqlConnection"/>
        /// </param>
        /// <param name="commandText">
        /// A <see cref="System.String"/> of the sql query.
        /// </param>
        /// <param name="commandType">
        /// A <see cref="CommandType"/> of the query type.
        /// </param>
        /// <returns>
        /// A <see cref="SqlCommand"/>
        /// </returns>
        public static SqlCommand GetCommand(this SqlConnection connection, string commandText, CommandType commandType)
        {
            SqlCommand command = connection.CreateCommand();
            command.CommandTimeout = connection.ConnectionTimeout;
            command.CommandType = commandType;
            command.CommandText = commandText;
            return command;
        }

        /// <summary>
        /// Adds a parameter to the command parameter array.
        /// </summary>
        /// <param name="command">
        /// A <see cref="SqlCommand"/> 
        /// </param>
        /// <param name="parameterName">
        /// A <see cref="System.String"/> of the named parameter in the sql query.
        /// </param>
        /// <param name="parameterValue">
        /// A <see cref="System.Object"/> of the parameter value.
        /// </param>
        /// <param name="parameterSqlType">
        /// A <see cref="SqlDbType"/>
        /// </param>
        public static void AddParameter(this SqlCommand command, string parameterName, object parameterValue, SqlDbType parameterSqlType)
        {
            if (!parameterName.StartsWith("@"))
            {
                parameterName = "@" + parameterName;
            }
            command.Parameters.Add(parameterName, parameterSqlType);
            command.Parameters[parameterName].Value = parameterValue;
        }
    }

    public partial class Default : System.Web.UI.Page
    {
        /// <summary>
        /// Handle the click event. This may need to be changed to let the front end handle the click and
		/// then hand off the info to the backend. If so it should be a simple matter of just calling
		/// the function directly. 
        /// </summary>
        public virtual void SaveButton_Click(object sender, EventArgs args)
        {
            // Establish the connection, this will need some updates once we have actual users
            using (SqlConnection connection = Helper.GetConnection("Pooling=true;Min Pool Size=5;Max Pool Size=40;Connect Timeout=10;server=192.168.0.1\instance;database=circuits;Integrated Security=false;User Id=Teacher;Password=Tutor1;"))
            {
                //create a command	
                using (SqlCommand command = connection.GetCommand("SELECT probID = @probID FROM dbo.probSet", CommandType.Text))
                {                    
                    command.AddParameter("@serialdata", serialdata.Text, SqlDbType.VarChar);
                    command.AddParameter("@probID", probID.Text, SqlDbType.VarChar);

                    // initialize the reader and execute
                    using (SqlDataReader reader = command.ExecuteReader())
                    {
                        if (!reader.HasRows)
                        {
                            reader.Close();
                            command.CommandText = "INSERT INTO dbo.circuits (serialdata, probID) VALUES (@serialdata, @probID)";
                            command.ExecuteNonQuery();
                        }
                    }
                }
            }
        }
    }
}