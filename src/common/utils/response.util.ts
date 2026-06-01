export function successResponse(data: any, message = 'Success', meta?: any) {
  return {
    success: true,
    message,
    data,
    ...(meta && { meta }),
    timestamp: new Date().toISOString(),
  };
}

export function paginatedResponse(
  data: any[],
  total: number,
  page: number,
  limit: number,
  message = 'Success',
) {
  return {
    success: true,
    message,
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
    timestamp: new Date().toISOString(),
  };
}
