namespace Baltika.Api.Modules.Teams.Domain;

public class Team
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Assistant { get; set; } = string.Empty;
    public string? Emblem { get; set; }
    public bool Active { get; set; }
}
