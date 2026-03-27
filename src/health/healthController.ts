import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Check service health',
    description: 'Pings the SQLite database. Returns `200` when healthy, `503` when the DB is unreachable.',
  })
  @ApiResponse({
    status: 200,
    description: 'All health indicators are up.',
    schema: {
      example: {
        status: 'ok',
        info: { database: { status: 'up' } },
        error: {},
        details: { database: { status: 'up' } },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'One or more health indicators are down.',
    schema: {
      example: {
        status: 'error',
        info: {},
        error: { database: { status: 'down', message: 'Connection refused' } },
        details: { database: { status: 'down', message: 'Connection refused' } },
      },
    },
  })
  check() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }
}
