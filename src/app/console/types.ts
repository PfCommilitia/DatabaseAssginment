export enum TabGroup {
  Society = 0
}

export enum Tab {
  ListSocietiesView = 0
}

export interface ConsoleState {
  expandedGroups: {
    get: () => TabGroup[];
    set: (newExpandedGroups: TabGroup[]) => void;
  },
  tab: {
    get: () => Tab | null;
    set: (newTab: Tab | null) => void;
  }
}
