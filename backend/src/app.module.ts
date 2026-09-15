import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsModule } from './jobs/jobs.module';
import { HealthModule } from './health/health.module';
import { Job } from './jobs/entities/job.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get<string>('DATABASE_URL');
        const dbSslEnv = configService.get<string>('DB_SSL');

        // Cloud databases (Render, Supabase, Neon) require SSL enabled when connecting remotely
        const isSsl =
          dbSslEnv === 'true' ||
          (Boolean(dbUrl) &&
            !dbUrl.includes('localhost') &&
            !dbUrl.includes('127.0.0.1'));

        if (dbUrl) {
          return {
            type: 'postgres',
            url: dbUrl,
            entities: [Job],
            synchronize: true,
            ssl: isSsl ? { rejectUnauthorized: false } : false,
          };
        }

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres'),
          database: configService.get<string>('DB_NAME', 'job_queue'),
          entities: [Job],
          synchronize: true,
          ssl: isSsl ? { rejectUnauthorized: false } : false,
        };
      },
    }),
    JobsModule,
    HealthModule,
  ],
})
export class AppModule {}
