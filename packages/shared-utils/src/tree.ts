import { MenuItem } from '@monorepo/shared-types';

export function buildMenuTree(items: MenuItem[]): MenuItem[] {
  const itemMap = new Map<string, MenuItem>();
  const rootItems: MenuItem[] = [];

  // Deep clone to avoid mutating input objects
  items.forEach((item) => {
    itemMap.set(item.menu_uuid, { ...item, children: [] });
  });

  items.forEach((item) => {
    const node = itemMap.get(item.menu_uuid);
    if (!node) return;

    if (item.parent_uuid && itemMap.has(item.parent_uuid)) {
      const parent = itemMap.get(item.parent_uuid);
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(node);
      }
    } else {
      rootItems.push(node);
    }
  });

  const sortNodes = (nodes: MenuItem[]): MenuItem[] => {
    nodes.sort((a, b) => a.display_order - b.display_order);
    nodes.forEach((n) => {
      if (n.children && n.children.length > 0) {
        sortNodes(n.children);
      }
    });
    return nodes;
  };

  return sortNodes(rootItems);
}

export function detectCircularReference(
  newParentUuid: string | null | undefined,
  targetUuid: string,
  allNodes: { menu_uuid: string; parent_uuid: string | null }[],
): boolean {
  if (!newParentUuid) return false;
  if (newParentUuid === targetUuid) return true;

  const parentMap = new Map<string, string | null>();
  allNodes.forEach((node) => {
    parentMap.set(node.menu_uuid, node.parent_uuid);
  });

  let currentParent: string | null | undefined = newParentUuid;
  const visited = new Set<string>();

  while (currentParent) {
    if (currentParent === targetUuid) {
      return true; // Circular dependency detected!
    }
    if (visited.has(currentParent)) {
      return true; // Loop in existing structure!
    }
    visited.add(currentParent);
    currentParent = parentMap.get(currentParent);
  }

  return false;
}

