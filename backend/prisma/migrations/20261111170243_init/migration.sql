-- CreateTable
CREATE TABLE "Note" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AIUsage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requestId" TEXT,
    "tipoOperacion" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "tokensEntrada" INTEGER NOT NULL,
    "tokensSalida" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "costoEntrada" REAL NOT NULL,
    "costoSalida" REAL NOT NULL,
    "costoTotal" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
