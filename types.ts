export interface PollData {
  design: {
    optionA: number; // Like it
    optionB: number; // Just show me price
  };
  scenarios: {
    [key: string]: number;
  };
}

export interface ItineraryItem {
  day: string;
  date: string;
  title: string;
  desc: string;
  icon: string; // Emoji or Lucide icon name
  image: string;
}

export interface GuideProfile {
  name: string;
  title: string;
  desc: string;
  image: string;
}
