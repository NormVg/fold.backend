-- CreateTable
CREATE TABLE "memory" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "mood" VARCHAR(20) NOT NULL,
    "text_content" TEXT,
    "audio_url" TEXT,
    "audio_duration_sec" INTEGER,
    "image_url" TEXT,
    "image_width" INTEGER,
    "image_height" INTEGER,
    "video_url" TEXT,
    "video_duration_sec" INTEGER,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "location_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "visibility" VARCHAR(20) NOT NULL DEFAULT 'private',

    CONSTRAINT "memory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "visibility" VARCHAR(20) NOT NULL DEFAULT 'private',

    CONSTRAINT "story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_pages" (
    "id" UUID NOT NULL,
    "story_id" UUID NOT NULL,
    "page_text" TEXT,
    "page_number" INTEGER NOT NULL,
    "is_attached_videos" BOOLEAN NOT NULL DEFAULT false,
    "is_attached_images" BOOLEAN NOT NULL DEFAULT false,
    "is_attached_audios" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "story_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_page_videos" (
    "id" UUID NOT NULL,
    "story_page_id" UUID NOT NULL,
    "video_url" TEXT NOT NULL,
    "video_duration_sec" INTEGER,

    CONSTRAINT "story_page_videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_page_audios" (
    "id" UUID NOT NULL,
    "story_page_id" UUID NOT NULL,
    "audio_url" TEXT NOT NULL,
    "audio_duration_sec" INTEGER,

    CONSTRAINT "story_page_audios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_page_images" (
    "id" UUID NOT NULL,
    "story_page_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "image_size" INTEGER,

    CONSTRAINT "story_page_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "icon_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "memory_user_id_created_at_idx" ON "memory"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "story_user_id_created_at_idx" ON "story"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "story_pages_story_id_page_number_idx" ON "story_pages"("story_id", "page_number");

-- CreateIndex
CREATE UNIQUE INDEX "story_pages_story_id_page_number_key" ON "story_pages"("story_id", "page_number");

-- CreateIndex
CREATE UNIQUE INDEX "badges_slug_key" ON "badges"("slug");

-- AddForeignKey
ALTER TABLE "memory" ADD CONSTRAINT "memory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story" ADD CONSTRAINT "story_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_pages" ADD CONSTRAINT "story_pages_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_page_videos" ADD CONSTRAINT "story_page_videos_story_page_id_fkey" FOREIGN KEY ("story_page_id") REFERENCES "story_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_page_audios" ADD CONSTRAINT "story_page_audios_story_page_id_fkey" FOREIGN KEY ("story_page_id") REFERENCES "story_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_page_images" ADD CONSTRAINT "story_page_images_story_page_id_fkey" FOREIGN KEY ("story_page_id") REFERENCES "story_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badges" ADD CONSTRAINT "badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
