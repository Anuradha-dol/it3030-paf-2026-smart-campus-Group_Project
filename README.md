# Smart Campus Group Project

## Quick Run (Backend)

### IntelliJ IDEA
1. Open the project from `pom.xml` (Maven import), not as plain folder.
2. Set Project SDK to `JDK 17`.
3. Open the run configuration `Run Server (Maven)` and click Run.
4. If it does not appear, press Maven tool window reload once.

### VS Code
1. Install Java Extension Pack.
2. Open `Run and Debug` and select `Run Smart Campus Server`.
3. Start debugging/run.

### Terminal
From project root:

```powershell
server\mvnw.cmd -f server\pom.xml spring-boot:run
```

If PostgreSQL auth fails, set your local DB credentials first:

```powershell
$env:DB_URL="jdbc:postgresql://localhost:5432/smart_campus_db"
$env:DB_USERNAME="postgres"
$env:DB_PASSWORD="your_real_password"
server\mvnw.cmd -f server\pom.xml spring-boot:run
```

Or on Windows:

```bat
run-server.cmd
```
