interface Iapi {
  GET_BLOGS_API(
    memberId: string,
    {
      count,
      fromDate,
      timeStatus,
    }: {
      count: string;
      fromDate: string;
      timeStatus: string;
    }
  ): void;
}

export { Iapi };
