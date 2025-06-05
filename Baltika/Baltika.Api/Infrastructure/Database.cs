using MySqlConnector;
using System.Data;

namespace Baltika.Api.Infrastructure;

public static class Database
{
    public static MySqlConnection CreateConnection(IConfiguration configuration)
    {
        var host = Environment.GetEnvironmentVariable("DB_HOST") ?? configuration["Database:Host"];
        var port = Environment.GetEnvironmentVariable("DB_PORT") ?? configuration["Database:Port"];
        var user = Environment.GetEnvironmentVariable("DB_USER") ?? configuration["Database:User"];
        var password = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? configuration["Database:Password"];
        var db = Environment.GetEnvironmentVariable("DB_NAME") ?? configuration["Database:Name"];
        var connectionString = $"Server={host};Port={port};User ID={user};Password={password};Database={db};";
        return new MySqlConnection(connectionString);
    }
}
