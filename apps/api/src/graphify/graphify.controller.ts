import { Controller, Get, Post, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GraphifyService } from './graphify.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Codebase Knowledge Graph (Graphify)')
@Controller('graphify')
export class GraphifyController {
  constructor(private readonly graphifyService: GraphifyService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get high-level knowledge graph metrics, hubs, and community clusters' })
  getStats() {
    return this.graphifyService.getStats();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search symbols and files in the AST knowledge graph' })
  @ApiQuery({ name: 'q', required: true, description: 'Symbol name or file query' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max results (default 20)' })
  searchNodes(@Query('q') q: string, @Query('limit') limit?: string) {
    const lim = limit ? parseInt(limit, 10) : 20;
    return this.graphifyService.searchNodes(q, lim);
  }

  @Get('node/:id')
  @ApiOperation({ summary: 'Get granular details and incoming/outgoing connections for a specific node' })
  getNodeDetails(@Param('id') id: string) {
    return this.graphifyService.getNodeDetails(id);
  }

  @Get('path')
  @ApiOperation({ summary: 'Trace the shortest architectural path between any two symbols or modules' })
  @ApiQuery({ name: 'from', required: true, description: 'Starting symbol name or ID' })
  @ApiQuery({ name: 'to', required: true, description: 'Destination symbol name or ID' })
  findPath(@Query('from') from: string, @Query('to') to: string) {
    return this.graphifyService.findShortestPath(from, to);
  }

  @Post('refresh')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('settings.manage')
  @ApiOperation({ summary: 'Trigger a background Tree-sitter AST re-extraction to refresh the knowledge graph' })
  async refreshGraph() {
    return this.graphifyService.rebuildGraph();
  }
}

