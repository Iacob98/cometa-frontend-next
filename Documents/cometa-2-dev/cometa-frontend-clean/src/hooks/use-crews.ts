import { useQuery } from '@tanstack/react-query';

export interface Crew {
  id: string;
  name: string;
  project_id?: string;
  foreman_user_id?: string;
  project_name?: string;
  foreman_name?: string;
  member_count: number;
}

const api = {
  getCrews: async (): Promise<Crew[]> => {
    const response = await fetch('/api/crews');

    if (!response.ok) {
      throw new Error('Failed to fetch crews');
    }

    return response.json();
  },
};

export function useCrews() {
  return useQuery({
    queryKey: ['crews'],
    queryFn: api.getCrews,
  });
}