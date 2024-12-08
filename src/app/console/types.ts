export enum Tab {
  User,
  Organisation,
  Society,
  Venue,
  SocietyApplication,
  EventApplication,
  EventParticipation
}

export interface ConsoleState {
  tab: {
    get: () => Tab | null;
    set: (newTab: Tab | null) => void;
  },
  filter: {
    get: () => Record<string, string[] | number[]>;
    set: (newFilter: Record<string, string[] | number[]>) => void;
  }
}
