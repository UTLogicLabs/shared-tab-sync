-- Migration number: 0001 	 2026-07-14T17:33:57.692Z
-- CreateTable
CREATE TABLE "Room" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UrlCache" (
    "url" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "faviconUrl" TEXT,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);
