export function viewableBy(userId: string) {
  return {
    OR: [
      { ownerId: userId },
      { assigneeId: userId },
      { permissions: { some: { userId } } },
    ],
  };
}

export function editableBy(userId: string) {
  return {
    OR: [
      { ownerId: userId },
      { permissions: { some: { userId, level: "EDIT" as const } } },
    ],
  };
}
