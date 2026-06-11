export class PaginatedResponseDto<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };

  constructor(data: T[], total: number, page: number, pageSize: number) {
    this.data = data;
    this.meta = {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
