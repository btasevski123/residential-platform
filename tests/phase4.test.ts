import assert from "node:assert/strict";
import { after, test } from "node:test";
import { AppError } from "../lib/errors";
import {
  createDocument,
  deleteDocument,
  getDocumentByFileUrl,
  getDocumentForUser,
} from "../lib/documents/service";
import { fileKeyFromUrl, isStoredFileUrl, storage } from "../lib/storage";
import { getBuildingBySlug, loadContext, prisma } from "./helpers";

const createdDocumentIds: string[] = [];

function isForbidden(error: unknown) {
  return error instanceof AppError && error.code === "FORBIDDEN";
}

function isValidation(error: unknown) {
  return error instanceof AppError && error.code === "VALIDATION";
}

function textFile(name: string, body = "Building file for Phase 4 tests.") {
  return new File([body], name, { type: "text/plain" });
}

after(async () => {
  if (createdDocumentIds.length > 0) {
    const rows = await prisma.document.findMany({
      where: { id: { in: createdDocumentIds } },
      select: { id: true, fileUrl: true },
    });
    await prisma.activityLog.deleteMany({
      where: { entityType: "Document", entityId: { in: createdDocumentIds } },
    });
    await prisma.document.deleteMany({ where: { id: { in: createdDocumentIds } } });
    await Promise.all(
      rows
        .filter((row) => isStoredFileUrl(row.fileUrl))
        .map((row) => storage.delete(fileKeyFromUrl(row.fileUrl))),
    );
  }
  await prisma.$disconnect();
});

test("resident cannot upload a document", async () => {
  const resident = await loadContext("resident@cityhome.mk");
  const building = await getBuildingBySlug("skopje-center-12");

  await assert.rejects(
    () =>
      createDocument(
        resident,
        building.id,
        { title: "Should not work", category: "RULES" },
        textFile("rules.txt"),
      ),
    isForbidden,
  );
});

test("admin can upload a document for their building", async () => {
  const admin = await loadContext("admin@cityhome.mk");
  const building = await getBuildingBySlug("skopje-center-12");
  const document = await createDocument(
    admin,
    building.id,
    {
      title: `Phase 4 house rules ${Date.now()}`,
      description: "Quiet hours and waste instructions.",
      category: "RULES",
    },
    textFile("house-rules.txt"),
  );
  createdDocumentIds.push(document.id);

  assert.equal(document.buildingId, building.id);
  assert.equal(document.uploadedById, admin.user.id);
  assert.ok(isStoredFileUrl(document.fileUrl));
});

test("resident cannot access another building's document", async () => {
  const resident = await loadContext("resident@cityhome.mk");
  const manager = await loadContext("manager@cityhome.mk");
  const otherBuilding = await getBuildingBySlug("aerodrom-25");
  const document = await createDocument(
    manager,
    otherBuilding.id,
    { title: "Aerodrom only file", category: "OTHER" },
    textFile("aerodrom.txt"),
  );
  createdDocumentIds.push(document.id);

  await assert.rejects(() => getDocumentForUser(resident, document.id), isForbidden);
  const hidden = await getDocumentByFileUrl(resident, document.fileUrl);
  assert.equal(hidden, null);
});

test("resident can view a document in their building", async () => {
  const admin = await loadContext("admin@cityhome.mk");
  const resident = await loadContext("resident@cityhome.mk");
  const building = await getBuildingBySlug("skopje-center-12");
  const document = await createDocument(
    admin,
    building.id,
    { title: `Phase 4 visible ${Date.now()}`, category: "MEETINGS" },
    textFile("minutes.txt"),
  );
  createdDocumentIds.push(document.id);

  const visible = await getDocumentForUser(resident, document.id);
  assert.equal(visible.id, document.id);
  assert.equal(visible.downloadable, true);
});

test("resident cannot delete a document", async () => {
  const admin = await loadContext("admin@cityhome.mk");
  const resident = await loadContext("resident@cityhome.mk");
  const building = await getBuildingBySlug("skopje-center-12");
  const document = await createDocument(
    admin,
    building.id,
    { title: `Phase 4 delete guard ${Date.now()}`, category: "OTHER" },
    textFile("keep.txt"),
  );
  createdDocumentIds.push(document.id);

  await assert.rejects(() => deleteDocument(resident, document.id), isForbidden);
});

test("admin can delete a document", async () => {
  const admin = await loadContext("admin@cityhome.mk");
  const building = await getBuildingBySlug("skopje-center-12");
  const document = await createDocument(
    admin,
    building.id,
    { title: `Phase 4 delete ${Date.now()}`, category: "OTHER" },
    textFile("remove.txt"),
  );

  await deleteDocument(admin, document.id);
  const missing = await prisma.document.findUnique({ where: { id: document.id } });
  assert.equal(missing, null);
});

test("unsupported file types are rejected", async () => {
  const admin = await loadContext("admin@cityhome.mk");
  const building = await getBuildingBySlug("skopje-center-12");
  const zip = new File(["PK"], "archive.zip", { type: "application/zip" });

  await assert.rejects(
    () => createDocument(admin, building.id, { title: "Zip should fail", category: "OTHER" }, zip),
    isValidation,
  );
});

test("uploading a document writes DOCUMENT_UPLOADED activity", async () => {
  const admin = await loadContext("admin@cityhome.mk");
  const building = await getBuildingBySlug("skopje-center-12");
  const document = await createDocument(
    admin,
    building.id,
    { title: `Phase 4 activity ${Date.now()}`, category: "CONTRACTS" },
    textFile("contract.txt"),
  );
  createdDocumentIds.push(document.id);

  const activity = await prisma.activityLog.findFirst({
    where: { entityType: "Document", entityId: document.id, action: "DOCUMENT_UPLOADED" },
  });
  assert.ok(activity);
  assert.equal(activity.actorId, admin.user.id);
});
