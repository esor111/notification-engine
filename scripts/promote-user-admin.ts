import 'dotenv/config';
import 'reflect-metadata';
import dataSource from '../typeorm.datasource';
import { AuditLogEntity } from '../src/common/audit/entity/audit-log.entity';
import { UserEntity } from '../src/modules/users/entity/user.entity';

async function main(): Promise<void> {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    throw new Error('Usage: npm run auth:promote-admin -- user@example.com');
  }

  await dataSource.initialize();

  try {
    const usersRepository = dataSource.getRepository(UserEntity);
    const user = await usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new Error(`User not found for email ${email}`);
    }

    user.role = 'admin';
    await usersRepository.save(user);
    await dataSource.getRepository(AuditLogEntity).save(
      dataSource.getRepository(AuditLogEntity).create({
        actorUserId: null,
        action: 'user.promoted_to_admin',
        resourceType: 'user',
        resourceId: user.id,
        metadata: {
          email: user.email,
        },
      }),
    );

    console.log(`Promoted ${email} to admin.`);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(`Failed to promote admin: ${message}`);
  process.exitCode = 1;
});
