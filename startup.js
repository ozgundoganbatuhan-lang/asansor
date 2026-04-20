const { execSync } = require("child_process");

function run(command) {
  execSync(command, { stdio: "inherit", env: process.env });
}

(async () => {
  try {
    run("./node_modules/.bin/prisma migrate deploy --schema=./prisma/schema.prisma");
  } catch (err) {
    console.warn("[startup] prisma migrate deploy başarısız oldu, db push denenecek:", err.message);
    try {
      run("./node_modules/.bin/prisma db push --skip-generate --schema=./prisma/schema.prisma");
    } catch (pushErr) {
      console.warn("[startup] prisma db push da başarısız oldu, uygulama yine de başlatılıyor:", pushErr.message);
    }
  }

  try {
    require("./server.js");
  } catch (err) {
    console.error("[startup] Server başlatılamadı:", err);
    process.exit(1);
  }
})();
