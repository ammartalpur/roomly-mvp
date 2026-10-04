-- Store the Cloudinary asset identifier so deleting a Roomly photo also removes the hosted asset.
ALTER TABLE "ResourcePhoto" ADD COLUMN "cloudinaryPublicId" TEXT;
