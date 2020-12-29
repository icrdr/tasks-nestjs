import { ConfigModule } from '@nestjs/config';

export const configModule = ConfigModule.forRoot({
  envFilePath: '.env',
  load: [
    () => {
      return {
        dbHost: process.env.DB_HOST || 'localhost',
        dbPort: 3306,
        dbDatabase:
          process.env.NODE_ENV === 'test' ? process.env.TEST_DATABASE : process.env.DB_DATABASE,
        dbUsername:
          process.env.NODE_ENV === 'test' ? process.env.TEST_USERNAME : process.env.DB_USERNAME,
        dbPassword:
          process.env.NODE_ENV === 'test' ? process.env.TEST_PASSWORD : process.env.DB_PASSWORD,
        adminUsername: process.env.ADMIN_USERNAME || 'admin',
        adminPassword: process.env.ADMIN_PASSWORD || 'admin',
        jwtSecret: process.env.JWT_SECRET || 'app',
        logLevel: process.env.NODE_ENV === 'prod' ? 'http' : 'debug',
        logSilent: process.env.NODE_ENV === 'test',
        defaultRoles: {
          admin: ['*'],
          user: ['common.*', 'common.user.*'],
        },
        options: {
          defaultRole: 'user',
          registrable: '1',
        },
        ossRegion: process.env.OSS_REGION,
        ossBucket: process.env.OSS_BUCKET,
        ossRoleArn: process.env.OSS_ROLE_ARN,
        ossAccessKeyId: process.env.OSS_ACCESSKEYID,
        ossAccessKeySecret: process.env.OSS_ACCESSKEYSECRET,
        yGcEnabled: process.env.Y_GC !== "false",
        yPersistenceDir: process.env.Y_PERSISTENCE_DIR,
      };
    },
  ],
  isGlobal: true,
});
