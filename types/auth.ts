import type {
  Apartment,
  Building,
  Membership,
  OrganizationMembership,
  User,
} from "@/generated/prisma/client";

export type BuildingMembership = Membership & {
  building: Building;
  apartment: Apartment | null;
};

export type SessionInfo = {
  id: string;
  activeBuildingId: string | null;
};

export type AccessContext = {
  user: User;
  organizationMemberships: OrganizationMembership[];
  memberships: BuildingMembership[];
  session: SessionInfo;
};

export type BuildingRef = {
  id: string;
  organizationId: string;
};
