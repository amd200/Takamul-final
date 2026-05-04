export const shiftsKeys = {
  all: ["shifts"] as const,
  lists: () => [...shiftsKeys.all, "list"] as const,
  list: (filters: any) => [...shiftsKeys.lists(), { filters }] as const,
  details: () => [...shiftsKeys.all, "detail"] as const,
  detail: (id: string | number) => [...shiftsKeys.details(), id] as const,
};
