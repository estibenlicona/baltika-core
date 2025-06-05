# Baltika Modular Monolith

This repository originally contained AWS Lambda functions written in Node.js. The project is being migrated to a modular monolith using **.NET 8**.

## .NET API

A new ASP.NET Core Web API project lives in the `Baltika.Api` folder. Modules are represented under `Baltika.Api/Modules` and include placeholder controllers for:

- Users & Authentication
- Teams
- Players
- Tournaments
- Seasons
- Fixtures & Matches
- Negotiations & Auctions
- Budgets
- Statistics

Run the API with:

```bash
cd Baltika.Api
dotnet run
```

Swagger is enabled in development for easy exploration of the available endpoints.
