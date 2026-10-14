/**
 * Resource Type Definitions
 * All game resources with icons, names, and i18n keys
 */

import { ResourceType } from './buildings';

export interface ResourceDefinition {
  id: ResourceType;
  nameKey: string; // i18n key for display name
  descriptionKey: string; // i18n key for description
  iconName: string; // Icon identifier (can be emoji or icon class)
  color: string; // Tailwind color class for UI
}

export const FOOD: ResourceDefinition = {
  id: ResourceType.FOOD,
  nameKey: 'resource.food.name',
  descriptionKey: 'resource.food.description',
  iconName: '🌾',
  color: 'text-amber-600',
};

export const WOOD: ResourceDefinition = {
  id: ResourceType.WOOD,
  nameKey: 'resource.wood.name',
  descriptionKey: 'resource.wood.description',
  iconName: '🪵',
  color: 'text-amber-800',
};

export const STONE: ResourceDefinition = {
  id: ResourceType.STONE,
  nameKey: 'resource.stone.name',
  descriptionKey: 'resource.stone.description',
  iconName: '🪨',
  color: 'text-gray-600',
};

export const IRON: ResourceDefinition = {
  id: ResourceType.IRON,
  nameKey: 'resource.iron.name',
  descriptionKey: 'resource.iron.description',
  iconName: '⚙️',
  color: 'text-slate-700',
};

export const ALL_RESOURCES: ResourceDefinition[] = [FOOD, WOOD, STONE, IRON];

export const RESOURCES_BY_ID: Record<ResourceType, ResourceDefinition> = {
  [ResourceType.FOOD]: FOOD,
  [ResourceType.WOOD]: WOOD,
  [ResourceType.STONE]: STONE,
  [ResourceType.IRON]: IRON,
};

export function getResourceById(id: ResourceType): ResourceDefinition {
  return RESOURCES_BY_ID[id];
}
