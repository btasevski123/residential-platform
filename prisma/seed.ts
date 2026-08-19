import "dotenv/config";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { hashPassword } from "../lib/auth/password";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const DEMO_PASSWORDS = {
  manager: "Manager123!",
  admin: "Admin123!",
  resident: "Resident123!",
  default: "Resident123!",
};

const PEOPLE = [
  ["Elena", "Trajkovska"],
  ["Goran", "Nikolovski"],
  ["Marija", "Stojanova"],
  ["Stefan", "Jovanovski"],
  ["Ivana", "Ristevska"],
  ["Nikola", "Angelov"],
  ["Sara", "Ilieva"],
  ["Dimitar", "Kocev"],
  ["Kristina", "Georgievska"],
  ["Petar", "Mitevski"],
  ["Maja", "Petrovska"],
  ["Igor", "Lazarevski"],
  ["Angela", "Taseva"],
  ["Viktor", "Dimov"],
  ["Simona", "Karanfilova"],
  ["Marko", "Spasovski"],
  ["Teodora", "Naumova"],
  ["Filip", "Arsov"],
  ["Ana", "Velkova"],
  ["Aleksandar", "Peshevski"],
  ["Biljana", "Krstevska"],
  ["Dejan", "Todorovski"],
  ["Jovana", "Cvetkovska"],
  ["Hristijan", "Popovski"],
  ["Natasha", "Zdravkova"],
  ["Bojan", "Iliev"],
  ["Katerina", "Mladenovska"],
  ["Martin", "Stojkov"],
  ["Frosina", "Andreeva"],
  ["Darko", "Petreski"],
  ["Lidija", "Sandeva"],
  ["Vlatko", "Ristov"],
  ["Monika", "Gjorgjeva"],
  ["Zoran", "Kitanov"],
  ["Elena", "Dimeska"],
  ["Goran", "Vasilev"],
  ["Marija", "Koceva"],
  ["Stefan", "Nikolov"],
  ["Ivana", "Petkova"],
  ["Nikola", "Trajkov"],
] as const;

const BUILDINGS = [
  {
    name: "Skopje Center 12",
    slug: "skopje-center-12",
    address: "11 Oktomvri 12",
    city: "Skopje",
    postalCode: "1000",
    apartmentCount: 12,
  },
  {
    name: "Aerodrom 25",
    slug: "aerodrom-25",
    address: "Jane Sandanski 25",
    city: "Skopje",
    postalCode: "1000",
    apartmentCount: 8,
  },
  {
    name: "Karposh 8",
    slug: "karposh-8",
    address: "Partizanski Odredi 8",
    city: "Skopje",
    postalCode: "1000",
    apartmentCount: 8,
  },
  {
    name: "Centar 44",
    slug: "centar-44",
    address: "Makedonija 44",
    city: "Skopje",
    postalCode: "1000",
    apartmentCount: 10,
  },
  {
    name: "Vodnjanska 18",
    slug: "vodnjanska-18",
    address: "Vodnjanska 18",
    city: "Skopje",
    postalCode: "1000",
    apartmentCount: 8,
  },
] as const;

async function resetDatabase() {
  await prisma.voteResponse.deleteMany();
  await prisma.voteOption.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.issueStatusHistory.deleteMany();
  await prisma.issueComment.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.document.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.organizationMembership.deleteMany();
  await prisma.apartment.deleteMany();
  await prisma.building.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();
}

async function writeDemoDocument(buildingId: string, slug: string, body: string) {
  const key = `documents/${buildingId}/${slug}.txt`;
  const absolute = path.join(process.cwd(), "uploads", key);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, body, "utf8");
  return {
    fileUrl: `/api/files/${key}`,
    fileName: `${slug}.txt`,
    mimeType: "text/plain",
    sizeBytes: Buffer.byteLength(body),
  };
}

async function createUser(input: {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone?: string;
}) {
  return prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      passwordHash: await hashPassword(input.password),
    },
  });
}

async function main() {
  console.log("Seeding NIVIA demo data...");
  await resetDatabase();

  const organization = await prisma.organization.create({
    data: {
      name: "CityHome Management",
      slug: "cityhome-management",
      type: "MANAGEMENT_COMPANY",
    },
  });

  const manager = await createUser({
    email: "manager@cityhome.mk",
    firstName: "Ana",
    lastName: "Petrova",
    password: DEMO_PASSWORDS.manager,
    phone: "+389 70 111 222",
  });

  const admin = await createUser({
    email: "admin@cityhome.mk",
    firstName: "Goran",
    lastName: "Nikolovski",
    password: DEMO_PASSWORDS.admin,
    phone: "+389 71 333 444",
  });

  const resident = await createUser({
    email: "resident@cityhome.mk",
    firstName: "Elena",
    lastName: "Trajkovska",
    password: DEMO_PASSWORDS.resident,
    phone: "+389 72 555 666",
  });

  await prisma.organizationMembership.create({
    data: {
      userId: manager.id,
      organizationId: organization.id,
      role: "MANAGER",
    },
  });

  const buildings = [];
  let personIndex = 2;

  for (const spec of BUILDINGS) {
    const building = await prisma.building.create({
      data: {
        organizationId: organization.id,
        name: spec.name,
        slug: spec.slug,
        address: spec.address,
        city: spec.city,
        postalCode: spec.postalCode,
        country: "North Macedonia",
      },
    });

    const apartments = [];
    for (let index = 1; index <= spec.apartmentCount; index += 1) {
      const apartment = await prisma.apartment.create({
        data: {
          buildingId: building.id,
          number: String(index),
          floor: Math.ceil(index / 2),
          entrance: index <= spec.apartmentCount / 2 ? "A" : "B",
        },
      });
      apartments.push(apartment);
    }

    buildings.push({ ...building, apartments });
  }

  const skopjeCenter = buildings[0];
  const demoApartment = skopjeCenter.apartments.find((apartment) => apartment.number === "4") ??
    skopjeCenter.apartments[3];

  await prisma.membership.create({
    data: {
      userId: admin.id,
      buildingId: skopjeCenter.id,
      role: "BUILDING_ADMIN",
    },
  });

  await prisma.membership.create({
    data: {
      userId: resident.id,
      buildingId: skopjeCenter.id,
      apartmentId: demoApartment.id,
      role: "RESIDENT",
    },
  });

  for (const building of buildings) {
    const remainingApartments =
      building.id === skopjeCenter.id
        ? building.apartments.filter((apartment) => apartment.id !== demoApartment.id)
        : building.apartments;

    for (const apartment of remainingApartments) {
      const [firstName, lastName] = PEOPLE[personIndex % PEOPLE.length];
      personIndex += 1;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${apartment.number}.${building.slug}@cityhome.mk`;

      const user = await createUser({
        email,
        firstName,
        lastName,
        password: DEMO_PASSWORDS.default,
        phone: `+389 7${(personIndex % 9) + 1} ${100 + personIndex} ${200 + personIndex}`,
      });

      await prisma.membership.create({
        data: {
          userId: user.id,
          buildingId: building.id,
          apartmentId: apartment.id,
          role: "RESIDENT",
        },
      });
    }
  }

  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const daysFromNow = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const elevatorAnnouncement = await prisma.announcement.create({
    data: {
      buildingId: skopjeCenter.id,
      authorId: admin.id,
      title: "Elevator maintenance this Thursday",
      content:
        "The elevator in entrance A will be out of service on Thursday from 09:00 to 14:00 for scheduled maintenance. Please plan accordingly, especially if you need assistance with heavy items.",
      priority: "IMPORTANT",
      publishedAt: daysAgo(1),
    },
  });

  await prisma.announcement.create({
    data: {
      buildingId: skopjeCenter.id,
      authorId: admin.id,
      title: "Water shutdown on Friday morning",
      content:
        "The municipal water company will interrupt supply on Friday between 08:00 and 11:00. Please store water in advance.",
      priority: "URGENT",
      publishedAt: daysAgo(2),
    },
  });

  await prisma.announcement.create({
    data: {
      buildingId: skopjeCenter.id,
      authorId: admin.id,
      title: "House council meeting notes",
      content:
        "Minutes from last week's house council meeting are now available in Documents. The next meeting is scheduled for 3 September at 19:00 in the lobby.",
      priority: "NORMAL",
      publishedAt: daysAgo(5),
    },
  });

  await prisma.announcement.create({
    data: {
      buildingId: buildings[1].id,
      authorId: manager.id,
      title: "Parking line repainting",
      content: "The parking area will be repainted next week. Please move vehicles when notified by the caretaker.",
      priority: "NORMAL",
      publishedAt: daysAgo(3),
    },
  });

  const heatingIssue = await prisma.issue.create({
    data: {
      buildingId: skopjeCenter.id,
      apartmentId: demoApartment.id,
      reporterId: resident.id,
      title: "Radiator not heating in the living room",
      description:
        "The living room radiator stays cold even when the valve is fully open. The bedroom radiator works normally.",
      category: "HEATING",
      status: "IN_PROGRESS",
    },
  });

  await prisma.issueStatusHistory.createMany({
    data: [
      {
        issueId: heatingIssue.id,
        fromStatus: null,
        toStatus: "REPORTED",
        changedById: resident.id,
        createdAt: daysAgo(6),
      },
      {
        issueId: heatingIssue.id,
        fromStatus: "REPORTED",
        toStatus: "IN_PROGRESS",
        changedById: admin.id,
        createdAt: daysAgo(5),
      },
    ],
  });

  await prisma.issueComment.create({
    data: {
      issueId: heatingIssue.id,
      authorId: admin.id,
      content: "A technician from Toplifikacija is scheduled for tomorrow afternoon.",
    },
  });

  const lightingIssue = await prisma.issue.create({
    data: {
      buildingId: skopjeCenter.id,
      reporterId: resident.id,
      title: "Lobby lights flickering in entrance A",
      description: "The ceiling lights on the ground floor flicker after 22:00. It feels unsafe at the entrance.",
      category: "ELECTRICITY",
      status: "REPORTED",
    },
  });

  await prisma.issueStatusHistory.create({
    data: {
      issueId: lightingIssue.id,
      fromStatus: null,
      toStatus: "REPORTED",
      changedById: resident.id,
    },
  });

  const elevatorIssue = await prisma.issue.create({
    data: {
      buildingId: skopjeCenter.id,
      reporterId: admin.id,
      title: "Elevator door closes too quickly",
      description: "Residents have reported that the elevator door in entrance B closes before people can enter safely.",
      category: "ELEVATOR",
      status: "RESOLVED",
    },
  });

  await prisma.issueStatusHistory.createMany({
    data: [
      {
        issueId: elevatorIssue.id,
        fromStatus: null,
        toStatus: "REPORTED",
        changedById: admin.id,
        createdAt: daysAgo(12),
      },
      {
        issueId: elevatorIssue.id,
        fromStatus: "REPORTED",
        toStatus: "IN_PROGRESS",
        changedById: admin.id,
        createdAt: daysAgo(10),
      },
      {
        issueId: elevatorIssue.id,
        fromStatus: "IN_PROGRESS",
        toStatus: "RESOLVED",
        changedById: admin.id,
        createdAt: daysAgo(8),
      },
    ],
  });

  await prisma.issue.create({
    data: {
      buildingId: buildings[1].id,
      reporterId: manager.id,
      title: "Cleaning schedule missed on Monday",
      description: "The stairwell in entrance A was not cleaned on the scheduled Monday visit.",
      category: "CLEANING",
      status: "REPORTED",
    },
  });

  const facadeVote = await prisma.vote.create({
    data: {
      buildingId: skopjeCenter.id,
      createdById: admin.id,
      title: "Facade renovation this autumn",
      description:
        "The house council proposes a facade renovation before winter. This vote is for planning purposes only and is not legally binding.",
      startsAt: daysAgo(3),
      endsAt: daysFromNow(10),
      options: {
        create: [
          { label: "Approve the proposed contractor", position: 0 },
          { label: "Request additional offers", position: 1 },
          { label: "Postpone until next year", position: 2 },
        ],
      },
    },
    include: { options: true },
  });

  const closedVote = await prisma.vote.create({
    data: {
      buildingId: skopjeCenter.id,
      createdById: admin.id,
      title: "Intercom upgrade",
      description: "Should we replace the current intercom system with a video intercom?",
      startsAt: daysAgo(20),
      endsAt: daysAgo(5),
      options: {
        create: [
          { label: "Yes, replace it", position: 0 },
          { label: "No, keep the current system", position: 1 },
        ],
      },
    },
    include: { options: true },
  });

  const centerResidents = await prisma.membership.findMany({
    where: { buildingId: skopjeCenter.id, role: "RESIDENT", isActive: true },
    include: { user: true },
  });

  await prisma.voteResponse.create({
    data: {
      voteId: facadeVote.id,
      optionId: facadeVote.options[0].id,
      userId: resident.id,
    },
  });

  for (const [index, membership] of centerResidents.slice(0, 8).entries()) {
    if (membership.userId === resident.id) {
      continue;
    }

    await prisma.voteResponse.create({
      data: {
        voteId: closedVote.id,
        optionId: closedVote.options[index % 2].id,
        userId: membership.userId,
      },
    });
  }

  const houseRulesFile = await writeDemoDocument(
    skopjeCenter.id,
    "house-rules-2026",
    "Quiet hours are 22:00–07:00. Dispose of waste in the designated bins. Bicycles belong in the basement racks.",
  );
  const minutesFile = await writeDemoDocument(
    skopjeCenter.id,
    "july-minutes",
    "The July house council agreed to obtain a second offer for the facade work and to keep the current cleaning schedule.",
  );
  const expensesFile = await writeDemoDocument(
    skopjeCenter.id,
    "q2-expenses",
    "Shared expenses April–June: cleaning, elevator service, and electricity for common areas.",
  );
  const contractFile = await writeDemoDocument(
    skopjeCenter.id,
    "elevator-contract",
    "Current elevator maintenance contract covers both cabins, with a 24-hour response for breakdowns.",
  );

  const houseRules = await prisma.document.create({
    data: {
      buildingId: skopjeCenter.id,
      uploadedById: admin.id,
      title: "House rules 2026",
      description: "Common area rules, quiet hours, and waste disposal instructions.",
      category: "RULES",
      ...houseRulesFile,
      createdAt: daysAgo(18),
    },
  });

  await prisma.document.createMany({
    data: [
      {
        buildingId: skopjeCenter.id,
        uploadedById: admin.id,
        title: "Meeting minutes — July",
        description: "Decisions from the July house council meeting.",
        category: "MEETINGS",
        ...minutesFile,
        createdAt: daysAgo(9),
      },
      {
        buildingId: skopjeCenter.id,
        uploadedById: manager.id,
        title: "Q2 shared expenses",
        description: "Summary of shared building expenses for April–June.",
        category: "FINANCES",
        ...expensesFile,
        createdAt: daysAgo(14),
      },
      {
        buildingId: skopjeCenter.id,
        uploadedById: admin.id,
        title: "Elevator service contract",
        description: "Current maintenance contract for both elevators.",
        category: "CONTRACTS",
        ...contractFile,
        createdAt: daysAgo(40),
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: resident.id,
        buildingId: skopjeCenter.id,
        type: "ANNOUNCEMENT_IMPORTANT",
        title: "Elevator maintenance this Thursday",
        body: "The elevator in entrance A will be out of service on Thursday from 09:00 to 14:00.",
        data: { announcementId: elevatorAnnouncement.id },
      },
      {
        userId: resident.id,
        buildingId: skopjeCenter.id,
        type: "ANNOUNCEMENT_URGENT",
        title: "Water shutdown on Friday morning",
        body: "Water supply will be interrupted on Friday between 08:00 and 11:00.",
      },
      {
        userId: resident.id,
        buildingId: skopjeCenter.id,
        type: "VOTE_CREATED",
        title: "New vote: Facade renovation this autumn",
        body: "A new building vote is open. Cast your vote before it closes.",
        data: { voteId: facadeVote.id },
      },
      {
        userId: admin.id,
        buildingId: skopjeCenter.id,
        type: "ISSUE_REPORTED",
        title: "New issue: Lobby lights flickering in entrance A",
        body: "A resident reported an electricity issue that needs attention.",
        data: { issueId: lightingIssue.id },
      },
      {
        userId: manager.id,
        buildingId: skopjeCenter.id,
        type: "ISSUE_REPORTED",
        title: "New issue: Lobby lights flickering in entrance A",
        body: "A resident reported an electricity issue at Skopje Center 12.",
        data: { issueId: lightingIssue.id },
      },
    ],
  });

  await prisma.activityLog.createMany({
    data: [
      {
        organizationId: organization.id,
        buildingId: skopjeCenter.id,
        actorId: admin.id,
        action: "ANNOUNCEMENT_PUBLISHED",
        entityType: "Announcement",
        entityId: elevatorAnnouncement.id,
        metadata: { title: elevatorAnnouncement.title },
        createdAt: daysAgo(1),
      },
      {
        organizationId: organization.id,
        buildingId: skopjeCenter.id,
        actorId: resident.id,
        action: "ISSUE_CREATED",
        entityType: "Issue",
        entityId: lightingIssue.id,
        metadata: { title: lightingIssue.title },
        createdAt: daysAgo(1),
      },
      {
        organizationId: organization.id,
        buildingId: skopjeCenter.id,
        actorId: admin.id,
        action: "ISSUE_STATUS_CHANGED",
        entityType: "Issue",
        entityId: heatingIssue.id,
        metadata: { toStatus: "IN_PROGRESS" },
        createdAt: daysAgo(5),
      },
      {
        organizationId: organization.id,
        buildingId: skopjeCenter.id,
        actorId: admin.id,
        action: "VOTE_CREATED",
        entityType: "Vote",
        entityId: facadeVote.id,
        metadata: { title: facadeVote.title },
        createdAt: daysAgo(3),
      },
      {
        organizationId: organization.id,
        buildingId: skopjeCenter.id,
        actorId: resident.id,
        action: "VOTE_CAST",
        entityType: "Vote",
        entityId: facadeVote.id,
        createdAt: daysAgo(2),
      },
      {
        organizationId: organization.id,
        buildingId: skopjeCenter.id,
        actorId: admin.id,
        action: "DOCUMENT_UPLOADED",
        entityType: "Document",
        entityId: houseRules.id,
        metadata: { title: "House rules 2026" },
        createdAt: daysAgo(18),
      },
    ],
  });

  console.log("Seed complete.");
  console.log("");
  console.log("Demo accounts:");
  console.log("  manager@cityhome.mk   / Manager123!");
  console.log("  admin@cityhome.mk     / Admin123!");
  console.log("  resident@cityhome.mk  / Resident123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
