import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface GraphNode {
  id: string;
  label: string;
  norm_label?: string;
  community?: number;
  community_name?: string;
  source_file?: string;
  source_location?: string;
  file_type?: string;
  _callable?: boolean;
  _callable_class?: boolean;
}

export interface GraphLink {
  source: string;
  target: string;
  relation: string;
  confidence?: string;
  weight?: number;
}

export interface GraphData {
  directed: boolean;
  built_at_commit?: string;
  nodes: GraphNode[];
  links: GraphLink[];
}

@Injectable()
export class GraphifyService {
  private readonly logger = new Logger(GraphifyService.name);
  private graphData: GraphData | null = null;
  private nodeMap = new Map<string, GraphNode>();
  private adjacency = new Map<string, Array<{ target: string; relation: string; incoming: boolean }>>();

  constructor() {
    this.loadGraph();
  }

  private resolveGraphPath(): string | null {
    const candidatePaths = [
      path.resolve(process.cwd(), '../../graphify-out/graph.json'),
      path.resolve(process.cwd(), '../graphify-out/graph.json'),
      path.resolve(process.cwd(), 'graphify-out/graph.json'),
      path.resolve(__dirname, '../../../../graphify-out/graph.json'),
      path.resolve(__dirname, '../../../../../graphify-out/graph.json'),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }
    return null;
  }

  private resolveVenvBin(): string {
    const candidateVenvs = [
      path.resolve(process.cwd(), '../../.venv/bin/graphify'),
      path.resolve(process.cwd(), '../.venv/bin/graphify'),
      path.resolve(process.cwd(), '.venv/bin/graphify'),
      path.resolve(__dirname, '../../../../.venv/bin/graphify'),
      path.resolve(__dirname, '../../../../../.venv/bin/graphify'),
    ];

    for (const p of candidateVenvs) {
      if (fs.existsSync(p)) {
        return p;
      }
    }
    return 'graphify';
  }

  loadGraph(): boolean {
    try {
      const graphPath = this.resolveGraphPath();
      if (!graphPath) {
        this.logger.warn('Graph file not found across candidate paths');
        return false;
      }

      const raw = fs.readFileSync(graphPath, 'utf8');
      this.graphData = JSON.parse(raw);

      this.nodeMap.clear();
      this.adjacency.clear();

      if (this.graphData?.nodes) {
        for (const node of this.graphData.nodes) {
          this.nodeMap.set(node.id, node);
          this.adjacency.set(node.id, []);
        }
      }

      if (this.graphData?.links) {
        for (const link of this.graphData.links) {
          const s = this.adjacency.get(link.source);
          if (s) {
            s.push({ target: link.target, relation: link.relation, incoming: false });
          }
          const t = this.adjacency.get(link.target);
          if (t) {
            t.push({ target: link.source, relation: link.relation, incoming: true });
          }
        }
      }

      this.logger.log(`Graph loaded: ${this.graphData?.nodes?.length || 0} nodes, ${this.graphData?.links?.length || 0} edges`);
      return true;
    } catch (err: any) {
      this.logger.error(`Failed to load graphify graph: ${err.message}`);
      return false;
    }
  }

  getStats() {
    if (!this.graphData) {
      this.loadGraph();
    }

    if (!this.graphData) {
      return {
        isAvailable: false,
        totalNodes: 0,
        totalEdges: 0,
        communitiesCount: 0,
        topHubs: [],
        communities: [],
      };
    }

    // Compute top connected nodes (hubs)
    const degreeCounts: Array<{ id: string; label: string; connections: number; source_file?: string }> = [];
    for (const [id, neighbors] of this.adjacency.entries()) {
      const node = this.nodeMap.get(id);
      if (node) {
        degreeCounts.push({
          id,
          label: node.label,
          connections: neighbors.length,
          source_file: node.source_file,
        });
      }
    }

    degreeCounts.sort((a, b) => b.connections - a.connections);
    const topHubs = degreeCounts.slice(0, 15);

    // Group communities
    const communityMap = new Map<number, { id: number; name: string; nodeCount: number }>();
    for (const node of this.graphData.nodes) {
      if (node.community !== undefined) {
        const existing = communityMap.get(node.community);
        if (existing) {
          existing.nodeCount++;
        } else {
          communityMap.set(node.community, {
            id: node.community,
            name: node.community_name || `Community ${node.community}`,
            nodeCount: 1,
          });
        }
      }
    }

    const communities = Array.from(communityMap.values()).sort((a, b) => b.nodeCount - a.nodeCount);

    return {
      isAvailable: true,
      totalNodes: this.graphData.nodes.length,
      totalEdges: this.graphData.links.length,
      communitiesCount: communities.length,
      tokenReductionRatio: '39.0x',
      builtAtCommit: this.graphData.built_at_commit || 'HEAD',
      topHubs,
      communities: communities.slice(0, 20),
    };
  }

  searchNodes(query: string, limit = 20): GraphNode[] {
    if (!this.graphData) this.loadGraph();
    if (!this.graphData || !query) return [];

    const q = query.toLowerCase().trim();
    const results: GraphNode[] = [];

    for (const node of this.graphData.nodes) {
      const labelMatch = node.label.toLowerCase().includes(q);
      const fileMatch = node.source_file?.toLowerCase().includes(q);

      if (labelMatch || fileMatch) {
        results.push(node);
        if (results.length >= limit) break;
      }
    }

    return results;
  }

  getNodeDetails(nodeIdOrLabel: string) {
    if (!this.graphData) this.loadGraph();

    let node = this.nodeMap.get(nodeIdOrLabel);
    if (!node) {
      // Try search by exact label match
      for (const n of this.nodeMap.values()) {
        if (n.label.toLowerCase() === nodeIdOrLabel.toLowerCase()) {
          node = n;
          break;
        }
      }
    }

    if (!node) {
      throw new NotFoundException(`Node "${nodeIdOrLabel}" not found in knowledge graph`);
    }

    const connections = this.adjacency.get(node.id) || [];
    const outgoing = connections
      .filter((c) => !c.incoming)
      .map((c) => ({
        target: this.nodeMap.get(c.target) || { id: c.target, label: c.target },
        relation: c.relation,
      }));

    const incoming = connections
      .filter((c) => c.incoming)
      .map((c) => ({
        source: this.nodeMap.get(c.target) || { id: c.target, label: c.target },
        relation: c.relation,
      }));

    return {
      node,
      totalConnections: connections.length,
      outgoing,
      incoming,
    };
  }

  findShortestPath(fromQuery: string, toQuery: string) {
    if (!this.graphData) this.loadGraph();

    const resolveNode = (q: string): GraphNode | null => {
      if (this.nodeMap.has(q)) return this.nodeMap.get(q)!;
      const lower = q.toLowerCase();
      for (const n of this.nodeMap.values()) {
        if (n.label.toLowerCase() === lower) return n;
      }
      return null;
    };

    const startNode = resolveNode(fromQuery);
    const endNode = resolveNode(toQuery);

    if (!startNode || !endNode) {
      return {
        found: false,
        message: `Could not resolve start (${fromQuery}) or destination (${toQuery}) node`,
        path: [],
      };
    }

    if (startNode.id === endNode.id) {
      return {
        found: true,
        hops: 0,
        path: [{ node: startNode, relation: 'self' }],
      };
    }

    // BFS Search
    const queue: Array<{ id: string; path: Array<{ nodeId: string; relation: string }> }> = [
      { id: startNode.id, path: [{ nodeId: startNode.id, relation: 'start' }] },
    ];
    const visited = new Set<string>([startNode.id]);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = this.adjacency.get(current.id) || [];

      for (const neighbor of neighbors) {
        if (neighbor.target === endNode.id) {
          const fullPath = [
            ...current.path,
            { nodeId: endNode.id, relation: neighbor.relation },
          ];

          const formattedPath = fullPath.map((step) => ({
            node: this.nodeMap.get(step.nodeId) || { id: step.nodeId, label: step.nodeId },
            relation: step.relation,
          }));

          return {
            found: true,
            hops: fullPath.length - 1,
            path: formattedPath,
          };
        }

        if (!visited.has(neighbor.target)) {
          visited.add(neighbor.target);
          queue.push({
            id: neighbor.target,
            path: [...current.path, { nodeId: neighbor.target, relation: neighbor.relation }],
          });
        }
      }
    }

    return {
      found: false,
      message: `No connection path found between "${startNode.label}" and "${endNode.label}"`,
      path: [],
    };
  }

  async rebuildGraph(): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log('Rebuilding graphify knowledge graph...');
      const venvBin = this.resolveVenvBin();
      const projectRoot = path.resolve(this.resolveGraphPath() || process.cwd(), '..');
      const { stdout } = await execAsync(`${venvBin} update "${projectRoot}"`);
      this.loadGraph();
      return { success: true, message: stdout || 'Knowledge graph updated successfully' };
    } catch (err: any) {
      this.logger.error(`Rebuild failed: ${err.message}`);
      return { success: false, message: err.message };
    }
  }
}
