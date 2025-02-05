-- CreateTable
CREATE TABLE "User" (
    "id" VARCHAR(255) NOT NULL,
    "username" VARCHAR(255) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Playlist" (
    "id" SERIAL NOT NULL,
    "userId" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "songs" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Playlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Playlist_name_key" ON "Playlist"("name");

-- AddForeignKey
ALTER TABLE "Playlist" ADD CONSTRAINT "Playlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
