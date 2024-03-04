import { PrismaClient, Profile } from '@prisma/client';
import DataLoader from 'dataloader';

// PROFILE BATCH LOADER
export const profileLoader = (prisma: PrismaClient) =>
  new DataLoader<string, Profile>(async (userIds) => {
    const userIdsMutable: string[] = [...userIds];

    const profiles = await prisma.profile.findMany({
      where: {
        userId: { in: userIdsMutable },
      },
    });

    // Map profiles by userId
    const profileMap = new Map<string, Profile>();
    profiles.forEach((profile) => {
      profileMap.set(profile.userId, profile);
    });

    // Return profiles in the same order as userId
    const processedProfiles = userIds.map((userId) =>
      profileMap.get(userId),
    ) as Profile[];
    return processedProfiles;
  });
